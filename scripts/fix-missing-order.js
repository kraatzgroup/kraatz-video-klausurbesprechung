#!/usr/bin/env node

/**
 * Fix missing order for existing user by checking Stripe checkout sessions
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rpgbyockvpannrupicno.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixMissingOrder() {
  try {
    const userId = '241e2d61-9303-435e-a687-74100e178e07';
    const stripeCustomerId = 'cus_TABW9FPWVDFXWW';
    
    console.log('🔧 Fixing missing order for user...');
    console.log('👤 User ID:', userId);
    console.log('🆔 Stripe Customer ID:', stripeCustomerId);

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ User not found:', userError);
      return;
    }

    console.log('👤 User:', user.email, `(${user.account_credits} credits)`);

    // Check Stripe for completed checkout sessions
    console.log('🔍 Checking Stripe for completed checkout sessions...');
    
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions?customer=${stripeCustomerId}&limit=10`, {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      }
    });

    if (!response.ok) {
      console.error('❌ Stripe API error:', response.status, response.statusText);
      return;
    }

    const sessionsData = await response.json();
    console.log('📊 Found', sessionsData.data.length, 'checkout sessions');

    for (const session of sessionsData.data) {
      console.log('🔍 Session:', session.id, 'Status:', session.status, 'Amount:', session.amount_total);
      
      if (session.status === 'complete') {
        console.log('✅ Found completed session:', session.id);
        console.log('📦 Metadata:', session.metadata);
        
        // Check if order already exists
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_payment_intent_id', session.id)
          .single();

        if (existingOrder) {
          console.log('⚠️ Order already exists for session:', session.id);
          continue;
        }

        // Get package info from metadata or line items
        let packageId = session.metadata?.packageId;
        
        if (!packageId) {
          console.log('🔍 No packageId in metadata, checking line items...');
          
          // Get line items from session
          const lineItemsResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items`, {
            headers: {
              'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            }
          });

          if (lineItemsResponse.ok) {
            const lineItemsData = await lineItemsResponse.json();
            console.log('📦 Line items:', lineItemsData.data.length);
            
            // Try to match by price
            for (const item of lineItemsData.data) {
              console.log('💰 Item:', item.description, 'Price:', item.amount_total);
              
              // Find package by price
              const { data: matchingPackages } = await supabase
                .from('packages')
                .select('*')
                .eq('price_cents', item.amount_total);

              if (matchingPackages && matchingPackages.length > 0) {
                packageId = matchingPackages[0].id;
                console.log('🎯 Found matching package:', matchingPackages[0].name);
                break;
              }
            }
          }
        }

        if (!packageId) {
          console.log('❌ Could not determine package for session:', session.id);
          continue;
        }

        // Get package details
        const { data: packageData, error: packageError } = await supabase
          .from('packages')
          .select('*')
          .eq('id', packageId)
          .single();

        if (packageError) {
          console.error('❌ Package not found:', packageId);
          continue;
        }

        console.log('📦 Creating order for package:', packageData.name, `(${packageData.case_study_count} credits)`);

        // Create order
        const { data: newOrder, error: createOrderError } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            package_id: packageId,
            stripe_payment_intent_id: session.id,
            status: 'completed',
            total_cents: session.amount_total || 0
          })
          .select('*, packages(*)')
          .single();

        if (createOrderError) {
          console.error('❌ Error creating order:', createOrderError);
          continue;
        }

        console.log('✅ Order created:', newOrder.id);

        // Update user credits
        const newCredits = user.account_credits + packageData.case_study_count;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ account_credits: newCredits })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Error updating credits:', updateError);
        } else {
          console.log('✅ Credits updated:', {
            oldCredits: user.account_credits,
            newCredits: newCredits,
            addedCredits: packageData.case_study_count
          });
          
          // Update local user object for next iteration
          user.account_credits = newCredits;
        }

        // Create notification
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'order_completed',
              title: 'Bestellung nachträglich verarbeitet',
              message: `Ihre Bestellung für ${packageData.name} wurde nachträglich verarbeitet. ${packageData.case_study_count} Credits wurden Ihrem Konto gutgeschrieben.`,
              metadata: {
                order_id: newOrder.id,
                package_name: packageData.name,
                credits_added: packageData.case_study_count
              }
            });

          console.log('✅ Notification created');
        } catch (notificationError) {
          console.error('⚠️ Error creating notification:', notificationError);
        }
      }
    }

    // Final user state
    const { data: finalUser } = await supabase
      .from('users')
      .select('account_credits')
      .eq('id', userId)
      .single();

    console.log('🎉 Final user credits:', finalUser.account_credits);
    console.log('✅ Missing order fix completed!');

  } catch (error) {
    console.error('💥 Fix failed:', error);
  }
}

fixMissingOrder();
