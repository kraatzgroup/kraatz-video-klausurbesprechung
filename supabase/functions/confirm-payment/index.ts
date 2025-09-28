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

    const { paymentIntentId } = await req.json()

    console.log('Confirming payment for payment intent:', paymentIntentId)

    // Retrieve payment intent from Stripe to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment has not succeeded')
    }

    // Get order from database
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, packages(*)')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single()

    if (orderError || !orderData) {
      throw new Error('Order not found')
    }

    // Update order status to completed
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderData.id)

    if (updateOrderError) {
      console.error('Error updating order status:', updateOrderError)
      throw new Error('Failed to update order status')
    }

    // Add credits to user account
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('account_credits')
      .eq('id', orderData.user_id)
      .single()

    if (userError || !userData) {
      throw new Error('User not found')
    }

    const newCredits = userData.account_credits + orderData.packages.case_study_count

    const { error: updateUserError } = await supabaseClient
      .from('users')
      .update({ account_credits: newCredits })
      .eq('id', orderData.user_id)

    if (updateUserError) {
      console.error('Error updating user credits:', updateUserError)
      throw new Error('Failed to update user credits')
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
      // Don't throw error here as payment was successful
    }

    console.log('Payment confirmed successfully for user:', orderData.user_id)
    console.log('Credits added:', orderData.packages.case_study_count)

    return new Response(
      JSON.stringify({
        success: true,
        creditsAdded: orderData.packages.case_study_count,
        newTotalCredits: newCredits,
        orderId: orderData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in confirm-payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
