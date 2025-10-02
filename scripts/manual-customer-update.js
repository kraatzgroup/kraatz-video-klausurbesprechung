#!/usr/bin/env node

/**
 * Manually update user with Stripe customer data
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rpgbyockvpannrupicno.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function manualCustomerUpdate() {
  try {
    const email = 'luetzenburger.philipp@googlemail.com';
    const stripeCustomerId = 'cus_TABEVuaQKYXkRy';
    const customerName = 'Phillipp Lützenburger';

    console.log('🔍 Searching for user by email...');
    
    // Find user by email
    let { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, stripe_customer_id')
      .eq('email', email)
      .single();

    if (findError && findError.code === 'PGRST116') {
      console.log('👤 User not found, creating new user...');
      
      // Parse name first
      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      
      // Generate UUID for user
      const userId = crypto.randomUUID();
      
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: 'student',
          account_credits: 0,
          stripe_customer_id: stripeCustomerId,
          email_notifications_enabled: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return;
      }

      existingUser = newUser;
      console.log('✅ Created new user:', existingUser.id);
    } else if (findError) {
      console.error('❌ Error finding user:', findError);
      return;
    }

    console.log('👤 Found user:', {
      id: existingUser.id,
      email: existingUser.email,
      currentFirstName: existingUser.first_name,
      currentLastName: existingUser.last_name,
      currentStripeId: existingUser.stripe_customer_id
    });

    // Parse name
    const nameParts = customerName.trim().split(' ');
    const firstName = nameParts[0] || null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    console.log('📝 Parsed name:', { firstName, lastName });

    // Update user
    console.log('🔄 Updating user...');
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        stripe_customer_id: stripeCustomerId
      })
      .eq('id', existingUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }

    console.log('✅ Successfully updated user:', {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      stripeCustomerId: updatedUser.stripe_customer_id
    });

    console.log('🎉 Manual customer update completed!');

  } catch (error) {
    console.error('💥 Manual update failed:', error);
  }
}

manualCustomerUpdate();
