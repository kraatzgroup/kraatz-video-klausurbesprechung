/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    const { packageId, userId, amount, currency = 'eur' } = await req.json()

    console.log('Creating payment intent for:', { packageId, userId, amount, currency })

    // Verify the package exists and is active
    const { data: packageData, error: packageError } = await supabaseClient
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .eq('active', true)
      .single()

    if (packageError || !packageData) {
      throw new Error('Package not found or inactive')
    }

    // Verify the user exists
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      throw new Error('User not found')
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: {
        packageId: packageId,
        userId: userId,
        packageName: packageData.name,
        caseStudyCount: packageData.case_study_count.toString()
      },
      description: `Kraatz Club - ${packageData.name} (${packageData.case_study_count} Klausuren)`,
      receipt_email: userData.email
    })

    // Create order record in database
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userId,
        package_id: packageId,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        total_cents: amount
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw new Error('Failed to create order record')
    }

    console.log('Payment intent created successfully:', paymentIntent.id)

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: orderData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create-payment-intent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
