import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabase-admin'

export interface StripeCustomerData {
  email: string
  firstName?: string | null
  lastName?: string | null
  stripeCustomerId: string
}

export class StripeUserService {
  /**
   * Find user by Stripe customer ID
   */
  static async findUserByStripeCustomerId(stripeCustomerId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error finding user by Stripe customer ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in findUserByStripeCustomerId:', error)
      return null
    }
  }

  /**
   * Find user by email address
   */
  static async findUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error finding user by email:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in findUserByEmail:', error)
      return null
    }
  }

  /**
   * Create new user from Stripe customer data
   */
  static async createUserFromStripeCustomer(customerData: StripeCustomerData) {
    try {
      console.log('👤 Creating new user from Stripe customer:', customerData.email)

      // Use the imported supabaseAdmin client
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: customerData.email,
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          role: 'student', // Default role for new customers
          account_credits: 0, // Start with 0 credits
          stripe_customer_id: customerData.stripeCustomerId,
          email_notifications_enabled: true // Default to enabled
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating user from Stripe customer:', error)
        throw error
      }

      console.log('✅ Successfully created user from Stripe customer:', data.id)
      return data
    } catch (error) {
      console.error('❌ Error in createUserFromStripeCustomer:', error)
      throw error
    }
  }

  /**
   * Update existing user with Stripe customer ID
   */
  static async linkUserToStripeCustomer(userId: string, stripeCustomerId: string) {
    try {
      console.log('🔗 Linking user to Stripe customer:', { userId, stripeCustomerId })

      // Use the imported supabaseAdmin client
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error linking user to Stripe customer:', error)
        throw error
      }

      console.log('✅ Successfully linked user to Stripe customer')
      return data
    } catch (error) {
      console.error('❌ Error in linkUserToStripeCustomer:', error)
      throw error
    }
  }

  /**
   * Update user information from Stripe customer data
   */
  static async updateUserFromStripeCustomer(userId: string, customerData: Partial<StripeCustomerData>) {
    try {
      console.log('🔄 Updating user from Stripe customer data:', userId)

      // Use the imported supabaseAdmin client
      const updateData: any = {}
      if (customerData.email) updateData.email = customerData.email
      if (customerData.firstName !== undefined) updateData.first_name = customerData.firstName
      if (customerData.lastName !== undefined) updateData.last_name = customerData.lastName

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating user from Stripe customer:', error)
        throw error
      }

      console.log('✅ Successfully updated user from Stripe customer')
      return data
    } catch (error) {
      console.error('❌ Error in updateUserFromStripeCustomer:', error)
      throw error
    }
  }

  /**
   * Ensure user exists for Stripe customer (create if needed)
   */
  static async ensureUserExistsForStripeCustomer(customerData: StripeCustomerData) {
    try {
      // First, try to find user by Stripe customer ID
      let user = await this.findUserByStripeCustomerId(customerData.stripeCustomerId)
      
      if (user) {
        console.log('ℹ️ User already exists for Stripe customer:', user.id)
        return user
      }

      // If not found by Stripe ID, try to find by email
      user = await this.findUserByEmail(customerData.email)
      
      if (user) {
        // User exists but doesn't have Stripe customer ID - link them
        console.log('🔗 Found existing user by email, linking to Stripe customer')
        return await this.linkUserToStripeCustomer(user.id, customerData.stripeCustomerId)
      }

      // User doesn't exist - create new one
      console.log('👤 No existing user found, creating new user')
      return await this.createUserFromStripeCustomer(customerData)
      
    } catch (error) {
      console.error('❌ Error in ensureUserExistsForStripeCustomer:', error)
      throw error
    }
  }

  /**
   * Get user's Stripe customer ID
   */
  static async getUserStripeCustomerId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error getting user Stripe customer ID:', error)
        return null
      }

      return data.stripe_customer_id
    } catch (error) {
      console.error('❌ Error in getUserStripeCustomerId:', error)
      return null
    }
  }

  /**
   * Check if user has valid Stripe customer
   */
  static async userHasStripeCustomer(userId: string): Promise<boolean> {
    const stripeCustomerId = await this.getUserStripeCustomerId(userId)
    return !!stripeCustomerId
  }
}
