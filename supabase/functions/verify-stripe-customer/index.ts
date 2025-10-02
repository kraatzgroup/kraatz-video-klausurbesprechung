import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'E-Mail-Adresse ist erforderlich' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    console.log(`🔍 Verifying Stripe customer for email: ${email}`)

    // Search for customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      console.log(`❌ No Stripe customer found for email: ${email}`)
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'E-Mail-Adresse nicht im System gefunden. Bitte erstellen Sie zunächst einen Account im Kraatz Club.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const customer = customers.data[0]
    console.log(`✅ Stripe customer found: ${customer.id} for email: ${email}`)

    // Check if customer has any successful payments (optional additional verification)
    const charges = await stripe.charges.list({
      customer: customer.id,
      limit: 1,
    })

    const hasPayments = charges.data.length > 0

    return new Response(
      JSON.stringify({ 
        verified: true, 
        customerId: customer.id,
        customerName: customer.name,
        hasPayments: hasPayments
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error verifying Stripe customer:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Fehler bei der Überprüfung der E-Mail-Adresse',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
