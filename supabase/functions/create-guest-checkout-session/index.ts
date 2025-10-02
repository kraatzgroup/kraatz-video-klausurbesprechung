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

    const { packageId, priceId, successUrl, cancelUrl } = await req.json()

    console.log('Creating guest checkout session for package:', packageId)

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

    // Create checkout session with Stripe for guest users
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
      // No customer_email - let user enter their own email
      allow_promotion_codes: true, // Enable promotion codes
      customer_creation: 'always', // Always create a customer
      billing_address_collection: 'required', // Require billing address with name
      shipping_address_collection: {
        allowed_countries: ['DE', 'AT', 'CH'] // Limit to DACH region
      },
      phone_number_collection: {
        enabled: false // Optional: disable phone collection
      },
      metadata: {
        packageId: packageId,
        packageName: packageData.name,
        caseStudyCount: packageData.case_study_count.toString(),
        guestCheckout: 'true' // Mark as guest checkout
      },
      payment_intent_data: {
        metadata: {
          packageId: packageId,
          packageName: packageData.name,
          caseStudyCount: packageData.case_study_count.toString(),
          guestCheckout: 'true'
        }
      }
    })

    console.log('Guest checkout session created successfully:', session.id)

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
    console.error('Error in create-guest-checkout-session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
