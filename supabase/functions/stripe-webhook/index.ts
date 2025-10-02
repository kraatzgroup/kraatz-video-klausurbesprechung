/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Skip JWT verification for Stripe webhooks
  // Stripe webhooks use signature verification instead
  console.log('🔗 Webhook request received from:', req.headers.get('user-agent'))

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      throw new Error('Missing stripe-signature header')
    }

    // Verify webhook signature (async version for Deno)
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Received Stripe webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSucceeded(supabaseClient, paymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(supabaseClient, failedPayment)
        break
      
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as any
        await handleCheckoutSessionCompleted(supabaseClient, checkoutSession)
        break
      
      case 'customer.created':
        const createdCustomer = event.data.object as any
        await handleCustomerCreated(supabaseClient, createdCustomer)
        break
      
      case 'customer.updated':
        const updatedCustomer = event.data.object as any
        await handleCustomerUpdated(supabaseClient, updatedCustomer)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in stripe-webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function handlePaymentSucceeded(supabaseClient: any, paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing successful payment:', paymentIntent.id)

    // Get order from database
    let { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, packages(*)')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    // If order doesn't exist, create it from payment intent metadata
    if (orderError || !orderData) {
      console.log('Order not found, creating from payment intent metadata')
      
      const packageId = paymentIntent.metadata.packageId
      const userId = paymentIntent.metadata.userId
      
      if (!packageId || !userId) {
        console.error('Missing metadata in payment intent:', paymentIntent.id)
        return
      }

      // Get package data
      const { data: packageData, error: packageError } = await supabaseClient
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single()

      if (packageError || !packageData) {
        console.error('Package not found:', packageId)
        return
      }

      // Create order
      const { data: newOrderData, error: createOrderError } = await supabaseClient
        .from('orders')
        .insert({
          user_id: userId,
          package_id: packageId,
          stripe_payment_intent_id: paymentIntent.id,
          status: 'pending',
          total_cents: paymentIntent.amount
        })
        .select('*, packages(*)')
        .single()

      if (createOrderError) {
        console.error('Error creating order:', createOrderError)
        return
      }

      orderData = newOrderData
    }

    // Skip if already processed
    if (orderData.status === 'completed') {
      console.log('Order already processed:', orderData.id)
      return
    }

    // Update order status to completed
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderData.id)

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError)
      return
    }

    // Add credits to user account
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('account_credits')
      .eq('id', orderData.user_id)
      .single()

    if (userError || !userData) {
      console.error('User not found:', orderData.user_id)
      return
    }

    const newCredits = userData.account_credits + orderData.packages.case_study_count

    const { error: updateUserError } = await supabaseClient
      .from('users')
      .update({ account_credits: newCredits })
      .eq('id', orderData.user_id)

    if (updateUserError) {
      console.error('Error updating user credits:', updateUserError)
      return
    }

    // Create notification for user
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: orderData.user_id,
        title: 'Zahlung erfolgreich',
        message: `Ihre Zahlung für ${orderData.packages.name} war erfolgreich. ${orderData.packages.case_study_count} Klausuren wurden Ihrem Konto gutgeschrieben.`,
        type: 'success'
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    console.log('Payment processed successfully:', {
      orderId: orderData.id,
      userId: orderData.user_id,
      creditsAdded: orderData.packages.case_study_count,
      newTotalCredits: newCredits
    })
  } catch (error) {
    console.error('Error processing successful payment:', error)
  }
}

async function handlePaymentFailed(supabaseClient: any, paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing failed payment:', paymentIntent.id)

    // Update order status to failed
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (updateOrderError) {
      console.error('Error updating failed order status:', updateOrderError)
      return
    }

    // Get order to send notification
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, packages(*)')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (orderError || !orderData) {
      console.error('Order not found for failed payment:', paymentIntent.id)
      return
    }

    // Create notification for user
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: orderData.user_id,
        title: 'Zahlung fehlgeschlagen',
        message: `Ihre Zahlung für ${orderData.packages.name} konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.`,
        type: 'error'
      })

    if (notificationError) {
      console.error('Error creating failed payment notification:', notificationError)
    }

    console.log('Failed payment processed:', orderData.id)
  } catch (error) {
    console.error('Error processing failed payment:', error)
  }
}

async function handleCheckoutSessionCompleted(supabaseClient: any, checkoutSession: any) {
  try {
    console.log('Processing checkout session completed:', checkoutSession.id)

    // Extract metadata from checkout session
    const packageId = checkoutSession.metadata?.packageId
    const userId = checkoutSession.metadata?.userId
    const isGuestCheckout = checkoutSession.metadata?.guestCheckout === 'true'
    
    if (!packageId) {
      console.error('Missing packageId in checkout session:', checkoutSession.id)
      return
    }

    // Handle guest checkout
    if (isGuestCheckout) {
      console.log('🎯 Processing guest checkout session')
      await handleGuestCheckoutSession(supabaseClient, checkoutSession, packageId)
      return
    }

    // Regular user checkout
    if (!userId) {
      console.error('Missing userId in checkout session:', checkoutSession.id)
      return
    }

    console.log('Checkout session metadata:', { packageId, userId })

    // Check if order already exists (from payment_intent.succeeded)
    let { data: existingOrder, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, packages(*)')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingOrder && !orderError) {
      console.log('Order already processed via payment_intent.succeeded:', existingOrder.id)
      return
    }

    // Get package data
    const { data: packageData, error: packageError } = await supabaseClient
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      console.error('Package not found:', packageId)
      return
    }

    // Create order for checkout session (especially for 100% discount cases)
    const { data: newOrder, error: createOrderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userId,
        package_id: packageId,
        stripe_payment_intent_id: checkoutSession.id, // Use session ID for 100% discount cases
        status: 'completed',
        total_cents: checkoutSession.amount_total || 0 // Will be 0 for 100% discount
      })
      .select('*, packages(*)')
      .single()

    if (createOrderError) {
      console.error('Error creating order from checkout session:', createOrderError)
      return
    }

    console.log('Order created from checkout session:', newOrder.id)

    // Add credits to user account
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('account_credits')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userId)
      return
    }

    const newCredits = userData.account_credits + packageData.case_study_count

    const { error: updateUserError } = await supabaseClient
      .from('users')
      .update({ account_credits: newCredits })
      .eq('id', userId)

    if (updateUserError) {
      console.error('Error updating user credits:', updateUserError)
      return
    }

    // Create notification for user
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Bestellung erfolgreich abgeschlossen',
        message: `Ihre Bestellung für ${packageData.name} wurde erfolgreich abgeschlossen. ${packageData.case_study_count} Credits wurden Ihrem Konto gutgeschrieben.`,
        type: 'success'
      })

    if (notificationError) {
      console.error('Error creating checkout notification:', notificationError)
    }

    // Create invoice for 0€ transactions (promotion codes)
    if (checkoutSession.amount_total === 0) {
      try {
        console.log('Creating invoice for 0€ transaction')
        
        // Get user data for invoice
        const { data: invoiceUserData, error: invoiceUserError } = await supabaseClient
          .from('users')
          .select('email, first_name, last_name')
          .eq('id', userId)
          .single()

        if (invoiceUserError || !invoiceUserData) {
          console.error('Could not get user data for invoice:', invoiceUserError)
          return
        }
        
        // Find or create Stripe customer
        // @ts-ignore - Stripe instance type inference issue
        const customers = await stripe.customers.list({
          email: invoiceUserData.email,
          limit: 1
        })

        let customerId
        if (customers.data.length > 0) {
          customerId = customers.data[0].id
        } else {
          // Create customer if not exists
          // @ts-ignore - Stripe instance type inference issue
          const customer = await stripe.customers.create({
            email: invoiceUserData.email,
            name: `${invoiceUserData.first_name || ''} ${invoiceUserData.last_name || ''}`.trim(),
            metadata: {
              supabase_user_id: userId
            }
          })
          customerId = customer.id
        }

        // Create invoice item
        // @ts-ignore - Stripe instance type inference issue
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: 0, // 0€ for promotion code purchases
          currency: 'eur',
          description: `${packageData.name} - Kraatz Club Case Study Paket (Promotion Code)`,
          metadata: {
            package_id: packageId,
            order_id: newOrder.id,
            promotion_code: 'applied'
          }
        })

        // Create and finalize invoice
        // @ts-ignore - Stripe instance type inference issue
        const invoice = await stripe.invoices.create({
          customer: customerId,
          collection_method: 'send_invoice',
          days_until_due: 30,
          metadata: {
            package_id: packageId,
            order_id: newOrder.id,
            checkout_session_id: checkoutSession.id
          }
        })

        // @ts-ignore - Stripe instance type inference issue
        await stripe.invoices.finalizeInvoice(invoice.id)
        console.log('Invoice created for 0€ transaction:', invoice.id)

      } catch (invoiceError) {
        console.error('Error creating invoice for 0€ transaction:', invoiceError)
        // Don't fail the whole process if invoice creation fails
      }
    }

    console.log('Checkout session processed successfully:', {
      sessionId: checkoutSession.id,
      orderId: newOrder.id,
      userId: userId,
      creditsAdded: packageData.case_study_count,
      newTotalCredits: newCredits,
      amountPaid: checkoutSession.amount_total || 0
    })

  } catch (error) {
    console.error('Error processing checkout session:', error)
  }
}

async function handleCustomerCreated(supabaseClient: any, customer: any) {
  try {
    console.log('👤 Processing customer.created event:', {
      customerId: customer.id,
      email: customer.email,
      name: customer.name
    })

    if (!customer.email) {
      console.error('❌ Customer has no email address')
      return
    }

    // Parse name into first_name and last_name
    let firstName: string | null = null
    let lastName: string | null = null

    if (customer.name) {
      const nameParts = customer.name.trim().split(' ')
      firstName = nameParts[0] || null
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
    }

    // Check if user already exists with this email
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('users')
      .select('id, stripe_customer_id')
      .eq('email', customer.email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', checkError)
      return
    }

    if (existingUser) {
      // User exists - update with Stripe customer ID if not already set
      if (!existingUser.stripe_customer_id) {
        console.log('🔄 Updating existing user with Stripe customer ID:', existingUser.id)
        
        const { error: updateError } = await supabaseClient
          .from('users')
          .update({ stripe_customer_id: customer.id })
          .eq('id', existingUser.id)

        if (updateError) {
          console.error('❌ Error updating user with Stripe customer ID:', updateError)
          return
        }

        console.log('✅ Successfully updated existing user with Stripe customer ID')
      } else {
        console.log('ℹ️ User already has Stripe customer ID:', existingUser.stripe_customer_id)
      }
    } else {
      // User doesn't exist - create new user with Auth + Database
      console.log('👤 Creating new user from Stripe customer with Auth + Database')
      
      try {
        // Create Auth user first using Supabase Admin API
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: customer.email,
          email_confirm: true, // Skip email confirmation
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            stripe_customer_id: customer.id,
            created_via: 'stripe_customer_created'
          }
        })

        if (authError) {
          console.error('❌ Error creating auth user:', authError)
          return
        }

        console.log('✅ Created auth user:', authUser.user.id)

        // Create database user with same ID
        const { data: newUser, error: createError } = await supabaseClient
          .from('users')
          .insert({
            id: authUser.user.id, // Use same ID as auth user
            email: customer.email,
            first_name: firstName,
            last_name: lastName,
            role: 'student', // Default role for new customers
            account_credits: 0, // Start with 0 credits
            stripe_customer_id: customer.id,
            email_notifications_enabled: true // Default to enabled
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creating database user:', createError)
          
          // Cleanup: Delete auth user if database creation failed
          await supabaseClient.auth.admin.deleteUser(authUser.user.id)
          console.log('🧹 Cleaned up auth user due to database error')
          return
        }

        console.log('✅ Successfully created complete user:', {
          userId: newUser.id,
          email: newUser.email,
          stripeCustomerId: newUser.stripe_customer_id
        })

        // Check if there are any completed checkout sessions for this customer
        // that haven't been processed yet (race condition handling)
        console.log('🔍 Checking for pending checkout sessions for customer:', customer.id)
        
        try {
          const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
          })

          // Get recent checkout sessions for this customer
          const sessionsResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions?customer=${customer.id}&limit=5`, {
            headers: {
              'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
            }
          })

          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json()
            
            for (const session of sessionsData.data) {
              if (session.status === 'complete' && session.metadata?.guestCheckout === 'true') {
                console.log('🎯 Found completed guest checkout session:', session.id)
                
                // Check if order already exists for this session
                const { data: existingOrder } = await supabaseClient
                  .from('orders')
                  .select('id')
                  .eq('stripe_payment_intent_id', session.id)
                  .single()

                if (!existingOrder) {
                  const packageId = session.metadata?.packageId
                  if (packageId) {
                    console.log('📦 Processing pending package order:', packageId)
                    await createOrderFromSession(supabaseClient, session, packageId, newUser.id)
                  }
                } else {
                  console.log('⚠️ Order already exists for session:', session.id)
                }
              }
            }
          }
        } catch (stripeError) {
          console.error('⚠️ Error checking for pending checkout sessions:', stripeError)
          // Don't fail the user creation if this fails
        }

      } catch (error) {
        console.error('❌ Error in user creation process:', error)
        return
      }
    }

  } catch (error) {
    console.error('❌ Error processing customer.created:', error)
  }
}

async function createOrderFromSession(supabaseClient: any, checkoutSession: any, packageId: string, userId: string) {
  try {
    console.log('📦 Creating order from checkout session:', {
      sessionId: checkoutSession.id,
      packageId: packageId,
      userId: userId
    })

    // Get package data
    const { data: packageData, error: packageError } = await supabaseClient
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      console.error('❌ Package not found:', packageId)
      return
    }

    // Create order
    const { data: newOrder, error: createOrderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userId,
        package_id: packageId,
        stripe_payment_intent_id: checkoutSession.id,
        status: 'completed',
        total_cents: checkoutSession.amount_total || 0
      })
      .select('*, packages(*)')
      .single()

    if (createOrderError) {
      console.error('❌ Error creating order:', createOrderError)
      return
    }

    console.log('✅ Order created:', newOrder.id)

    // Add credits to user account
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('account_credits')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found for credit update:', userId)
      return
    }

    const newCredits = userData.account_credits + packageData.case_study_count

    const { error: updateUserError } = await supabaseClient
      .from('users')
      .update({ account_credits: newCredits })
      .eq('id', userId)

    if (updateUserError) {
      console.error('❌ Error updating user credits:', updateUserError)
      return
    }

    console.log('✅ Credits updated:', {
      userId: userId,
      oldCredits: userData.account_credits,
      newCredits: newCredits,
      addedCredits: packageData.case_study_count
    })

    // Create notification for user
    try {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'order_completed',
          title: 'Bestellung abgeschlossen',
          message: `Ihre Bestellung für ${packageData.name} wurde erfolgreich abgeschlossen. ${packageData.case_study_count} Credits wurden Ihrem Konto gutgeschrieben.`,
          metadata: {
            order_id: newOrder.id,
            package_name: packageData.name,
            credits_added: packageData.case_study_count
          }
        })

      console.log('✅ Notification created for user:', userId)
    } catch (notificationError) {
      console.error('⚠️ Error creating notification:', notificationError)
      // Don't fail the order creation if notification fails
    }

  } catch (error) {
    console.error('❌ Error creating order from session:', error)
  }
}

async function handleCustomerUpdated(supabaseClient: any, customer: any) {
  try {
    console.log('🔄 Processing customer.updated event:', {
      customerId: customer.id,
      email: customer.email,
      name: customer.name
    })

    if (!customer.email) {
      console.log('⚠️ Customer update has no email, skipping')
      return
    }

    // Find user by Stripe customer ID first
    let { data: existingUser, error: findError } = await supabaseClient
      .from('users')
      .select('id, email, first_name, last_name, stripe_customer_id')
      .eq('stripe_customer_id', customer.id)
      .single()

    // If not found by customer ID, try to find by email and link them
    if (findError && findError.code === 'PGRST116') {
      console.log('🔍 User not found by customer ID, searching by email:', customer.email)
      
      const { data: userByEmail, error: emailError } = await supabaseClient
        .from('users')
        .select('id, email, first_name, last_name, stripe_customer_id')
        .eq('email', customer.email)
        .single()

      if (userByEmail && !emailError) {
        console.log('✅ Found user by email, linking Stripe customer ID')
        
        // Update user with Stripe customer ID
        const { error: linkError } = await supabaseClient
          .from('users')
          .update({ stripe_customer_id: customer.id })
          .eq('id', userByEmail.id)

        if (linkError) {
          console.error('❌ Error linking Stripe customer ID:', linkError)
          return
        }

        existingUser = { ...userByEmail, stripe_customer_id: customer.id }
        console.log('🔗 Successfully linked user to Stripe customer')
      } else {
        console.log('⚠️ User not found by email either:', customer.email)
        return
      }
    } else if (findError) {
      console.error('❌ Error finding user:', findError)
      return
    }

    // Parse updated name
    let firstName: string | null = null
    let lastName: string | null = null

    if (customer.name) {
      const nameParts = customer.name.trim().split(' ')
      firstName = nameParts[0] || null
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
    }

    // Update user with new information
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        email: customer.email,
        first_name: firstName,
        last_name: lastName
      })
      .eq('id', existingUser.id)

    if (updateError) {
      console.error('❌ Error updating user from Stripe customer:', updateError)
      return
    }

    console.log('✅ Successfully updated user from Stripe customer')
    
  } catch (error) {
    console.error('❌ Error processing customer.updated:', error)
  }
}

async function handleGuestCheckoutSession(supabaseClient: any, checkoutSession: any, packageId: string) {
  try {
    console.log('👤 Processing guest checkout session:', {
      sessionId: checkoutSession.id,
      customerEmail: checkoutSession.customer_details?.email,
      customerId: checkoutSession.customer
    })

    // Get customer email from checkout session
    const customerEmail = checkoutSession.customer_details?.email
    if (!customerEmail) {
      console.error('❌ No customer email in guest checkout session')
      return
    }

    // Get Stripe customer ID
    const stripeCustomerId = checkoutSession.customer
    if (!stripeCustomerId) {
      console.error('❌ No customer ID in guest checkout session')
      return
    }

    // Get package data
    const { data: packageData, error: packageError } = await supabaseClient
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      console.error('❌ Package not found:', packageId)
      return
    }

    // Parse customer name from Stripe billing address (primary source)
    let firstName: string | null = null
    let lastName: string | null = null
    
    // Primary: Get name from billing address (required field)
    if (checkoutSession.customer_details?.address?.name) {
      const fullName = checkoutSession.customer_details.address.name.trim()
      const nameParts = fullName.split(' ')
      firstName = nameParts[0] || null
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
      console.log('📝 Name from billing address:', { firstName, lastName, fullName })
    }
    
    // Fallback to customer_details name if billing address name not available
    else if (checkoutSession.customer_details?.name) {
      const fullName = checkoutSession.customer_details.name.trim()
      const nameParts = fullName.split(' ')
      firstName = nameParts[0] || null
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
      console.log('📝 Name from customer_details (fallback):', { firstName, lastName, fullName })
    }
    
    // Validate that we have at least first name
    if (!firstName) {
      console.error('❌ No name found in billing address or customer details')
      return
    }

    // Check if user already exists by email
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', customerEmail)
      .single()

    let userId: string

    if (existingUser && !userCheckError) {
      // User exists - update with Stripe customer ID if missing
      console.log('✅ Found existing user:', existingUser.id)
      userId = existingUser.id

      if (!existingUser.stripe_customer_id) {
        console.log('🔄 Updating existing user with Stripe customer ID')
        await supabaseClient
          .from('users')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', userId)
      }
    } else {
      // Create new user from guest checkout
      console.log('👤 Creating new user from guest checkout with Auth + Database')
      
      try {
        // Create Auth user first using Supabase Admin API
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true, // Skip email confirmation for guest checkout
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            stripe_customer_id: stripeCustomerId,
            created_via: 'guest_checkout'
          }
        })

        if (authError) {
          console.error('❌ Error creating auth user:', authError)
          return
        }

        console.log('✅ Created auth user:', authUser.user.id)

        // Create database user with same ID
        const { data: newUser, error: createError } = await supabaseClient
          .from('users')
          .insert({
            id: authUser.user.id, // Use same ID as auth user
            email: customerEmail,
            first_name: firstName,
            last_name: lastName,
            role: 'student',
            account_credits: 0,
            stripe_customer_id: stripeCustomerId,
            email_notifications_enabled: true
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creating database user:', createError)
          
          // Cleanup: Delete auth user if database creation failed
          await supabaseClient.auth.admin.deleteUser(authUser.user.id)
          console.log('🧹 Cleaned up auth user due to database error')
          return
        }

        userId = newUser.id
        console.log('✅ Created complete user (auth + database):', userId)

      } catch (error) {
        console.error('❌ Error in user creation process:', error)
        return
      }
    }

    // Create order
    const { data: newOrder, error: createOrderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userId,
        package_id: packageId,
        stripe_payment_intent_id: checkoutSession.id,
        status: 'completed',
        total_cents: checkoutSession.amount_total || 0
      })
      .select('*, packages(*)')
      .single()

    if (createOrderError) {
      console.error('❌ Error creating order from guest checkout:', createOrderError)
      return
    }

    console.log('✅ Order created from guest checkout:', newOrder.id)

    // Add credits to user account
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('account_credits')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found for credit update:', userId)
      return
    }

    const newCredits = userData.account_credits + packageData.case_study_count

    const { error: updateUserError } = await supabaseClient
      .from('users')
      .update({ account_credits: newCredits })
      .eq('id', userId)

    if (updateUserError) {
      console.error('❌ Error updating user credits:', updateUserError)
      return
    }

    // Create notification for user
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Willkommen bei Kraatz Club!',
        message: `Ihre Bestellung für ${packageData.name} wurde erfolgreich abgeschlossen. ${packageData.case_study_count} Credits wurden Ihrem Konto gutgeschrieben. Sie können sich jetzt mit Ihrer E-Mail-Adresse einloggen.`,
        type: 'success'
      })

    if (notificationError) {
      console.error('❌ Error creating guest checkout notification:', notificationError)
    }

    console.log('🎉 Guest checkout processed successfully:', {
      sessionId: checkoutSession.id,
      orderId: newOrder.id,
      userId: userId,
      email: customerEmail,
      creditsAdded: packageData.case_study_count,
      newTotalCredits: newCredits
    })

  } catch (error) {
    console.error('❌ Error processing guest checkout session:', error)
  }
}

