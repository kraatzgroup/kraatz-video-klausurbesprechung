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
    
    if (!packageId || !userId) {
      console.error('Missing metadata in checkout session:', checkoutSession.id)
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

