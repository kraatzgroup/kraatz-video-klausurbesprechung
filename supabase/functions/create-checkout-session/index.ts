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

    const { packageId, userId, priceId, successUrl, cancelUrl } = await req.json()

    console.log('Creating checkout session for:', { packageId, userId, priceId })

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

    // Create checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userData.email,
      allow_promotion_codes: true, // Enable promotion codes
      metadata: {
        packageId: packageId,
        userId: userId,
        packageName: packageData.name,
        caseStudyCount: packageData.case_study_count.toString()
      },
      payment_intent_data: {
        metadata: {
          packageId: packageId,
          userId: userId,
          packageName: packageData.name,
          caseStudyCount: packageData.case_study_count.toString()
        }
      }
    })

    // Don't create order record yet - wait for webhook to handle it
    // The webhook will create the order when payment_intent.succeeded is received
    console.log('Checkout session created, order will be created via webhook')

    console.log('Checkout session created successfully:', session.id)

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create-checkout-session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
