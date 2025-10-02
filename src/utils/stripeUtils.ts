import { supabase } from '../lib/supabase'

export interface CreatePaymentIntentRequest {
  packageId: string
  userId: string
}

export interface CreatePaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
}

export const createGuestCheckoutSession = async (
  request: { packageId: string }
): Promise<{ url: string }> => {
  try {
    // Get package details from the database
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', request.packageId)
      .eq('active', true)
      .single()

    if (packageError || !packageData) {
      throw new Error('Package not found or inactive')
    }

    // Call the Supabase Edge Function for guest checkout
    const { data, error } = await supabase.functions.invoke('create-guest-checkout-session', {
      body: {
        packageId: request.packageId,
        priceId: packageData.stripe_price_id,
        successUrl: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/packages`
      }
    })

    if (error) {
      throw new Error(`Guest checkout session creation failed: ${error.message}`)
    }

    return {
      url: data.url
    }
  } catch (error) {
    console.error('Error creating guest checkout session:', error)
    throw error
  }
}

export const createCheckoutSession = async (
  request: CreatePaymentIntentRequest
): Promise<{ url: string }> => {
  try {
    // First, get the package details from the database
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', request.packageId)
      .eq('active', true)
      .single()

    if (packageError || !packageData) {
      throw new Error('Package not found or inactive')
    }

    // Call the Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        packageId: request.packageId,
        userId: request.userId,
        priceId: packageData.stripe_price_id,
        successUrl: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/packages`
      }
    })

    if (error) {
      throw new Error(`Checkout session creation failed: ${error.message}`)
    }

    return {
      url: data.url
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Keep the old function for backward compatibility
export const createPaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> => {
  try {
    // First, get the package details from the database
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', request.packageId)
      .eq('active', true)
      .single()

    if (packageError || !packageData) {
      throw new Error('Package not found or inactive')
    }

    // Call the Supabase Edge Function to create payment intent
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        packageId: request.packageId,
        userId: request.userId,
        amount: packageData.price_cents,
        currency: 'eur'
      }
    })

    if (error) {
      throw new Error(`Payment intent creation failed: ${error.message}`)
    }

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

export const confirmPayment = async (paymentIntentId: string) => {
  try {
    // Call the Supabase Edge Function to confirm payment and update user credits
    const { data, error } = await supabase.functions.invoke('confirm-payment', {
      body: {
        paymentIntentId
      }
    })

    if (error) {
      throw new Error(`Payment confirmation failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error confirming payment:', error)
    throw error
  }
}

export const getPackages = async () => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('active', true)
      .order('case_study_count', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch packages: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error fetching packages:', error)
    throw error
  }
}
