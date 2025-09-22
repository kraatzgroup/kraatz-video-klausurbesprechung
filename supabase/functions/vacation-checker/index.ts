import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  instructor_legal_area?: string
  email_notifications_enabled: boolean
  vacation_start_date?: string
  vacation_end_date?: string
  vacation_reason?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🏖️ Vacation Checker started at:', new Date().toISOString())

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]
    console.log('📅 Checking vacation status for date:', today)

    // 1. Find users who should be on vacation today
    console.log('\n1. 🔍 Finding users who should be on vacation...')
    const { data: usersOnVacation, error: vacationError } = await supabaseClient
      .from('users')
      .select('*')
      .not('vacation_start_date', 'is', null)
      .not('vacation_end_date', 'is', null)
      .lte('vacation_start_date', today)
      .gte('vacation_end_date', today)

    if (vacationError) {
      console.error('❌ Error fetching vacation users:', vacationError)
      throw vacationError
    }

    console.log(`   📊 Found ${usersOnVacation?.length || 0} users who should be on vacation`)

    // 2. Find users whose vacation has ended
    console.log('\n2. 🔍 Finding users whose vacation has ended...')
    const { data: usersVacationEnded, error: endedError } = await supabaseClient
      .from('users')
      .select('*')
      .not('vacation_end_date', 'is', null)
      .lt('vacation_end_date', today)
      .eq('email_notifications_enabled', false)

    if (endedError) {
      console.error('❌ Error fetching ended vacation users:', endedError)
      throw endedError
    }

    console.log(`   📊 Found ${usersVacationEnded?.length || 0} users whose vacation has ended`)

    const results = {
      date: today,
      usersOnVacation: [],
      usersReturnedFromVacation: [],
      actions: []
    }

    // 3. Process users who should be on vacation
    if (usersOnVacation && usersOnVacation.length > 0) {
      console.log('\n3. 🏖️ Processing users on vacation...')
      
      for (const user of usersOnVacation) {
        console.log(`   👤 ${user.first_name} ${user.last_name} (${user.email})`)
        console.log(`      📅 Vacation: ${user.vacation_start_date} to ${user.vacation_end_date}`)
        console.log(`      🎯 Role: ${user.role} (${user.instructor_legal_area || 'N/A'})`)
        
        // Ensure email notifications are disabled for users on vacation
        if (user.email_notifications_enabled) {
          console.log(`      🔄 Disabling email notifications...`)
          
          const { error: updateError } = await supabaseClient
            .from('users')
            .update({ email_notifications_enabled: false })
            .eq('id', user.id)

          if (updateError) {
            console.error(`      ❌ Error updating user ${user.id}:`, updateError)
            results.actions.push({
              user_id: user.id,
              action: 'disable_notifications',
              status: 'error',
              error: updateError.message
            })
          } else {
            console.log(`      ✅ Email notifications disabled`)
            
            // Transfer cases to springer
            console.log(`      🔄 Transferring cases to springer...`)
            try {
              const transferResponse = await supabaseClient.functions.invoke('transfer-cases', {
                body: {
                  instructor_id: user.id,
                  reason: 'vacation_start'
                }
              })

              if (transferResponse.error) {
                console.error(`      ❌ Error transferring cases:`, transferResponse.error)
                results.actions.push({
                  user_id: user.id,
                  action: 'transfer_cases_to_springer',
                  status: 'error',
                  error: transferResponse.error.message
                })
              } else {
                console.log(`      ✅ Cases transferred to springer`)
                results.actions.push({
                  user_id: user.id,
                  action: 'transfer_cases_to_springer',
                  status: 'success',
                  cases_transferred: transferResponse.data?.transferred_cases?.length || 0
                })
              }
            } catch (transferError) {
              console.error(`      ❌ Transfer function error:`, transferError)
              results.actions.push({
                user_id: user.id,
                action: 'transfer_cases_to_springer',
                status: 'error',
                error: transferError.message
              })
            }

            results.actions.push({
              user_id: user.id,
              action: 'disable_notifications',
              status: 'success'
            })
          }
        } else {
          console.log(`      ✅ Email notifications already disabled`)
        }

        results.usersOnVacation.push({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          legal_area: user.instructor_legal_area,
          vacation_start: user.vacation_start_date,
          vacation_end: user.vacation_end_date,
          reason: user.vacation_reason
        })
      }
    }

    // 4. Process users whose vacation has ended
    if (usersVacationEnded && usersVacationEnded.length > 0) {
      console.log('\n4. 🎯 Processing users returning from vacation...')
      
      for (const user of usersVacationEnded) {
        console.log(`   👤 ${user.first_name} ${user.last_name} (${user.email})`)
        console.log(`      📅 Vacation ended: ${user.vacation_end_date}`)
        console.log(`      🔄 Re-enabling email notifications and clearing vacation dates...`)
        
        const { error: updateError } = await supabaseClient
          .from('users')
          .update({ 
            email_notifications_enabled: true,
            vacation_start_date: null,
            vacation_end_date: null,
            vacation_reason: null
          })
          .eq('id', user.id)

        if (updateError) {
          console.error(`      ❌ Error updating user ${user.id}:`, updateError)
          results.actions.push({
            user_id: user.id,
            action: 'enable_notifications',
            status: 'error',
            error: updateError.message
          })
        } else {
          console.log(`      ✅ User returned from vacation - notifications re-enabled`)
          
          // Transfer cases back from springer
          console.log(`      🔄 Transferring cases back from springer...`)
          try {
            const transferResponse = await supabaseClient.functions.invoke('transfer-cases', {
              body: {
                instructor_id: user.id,
                reason: 'vacation_end'
              }
            })

            if (transferResponse.error) {
              console.error(`      ❌ Error transferring cases back:`, transferResponse.error)
              results.actions.push({
                user_id: user.id,
                action: 'transfer_cases_from_springer',
                status: 'error',
                error: transferResponse.error.message
              })
            } else {
              console.log(`      ✅ Cases transferred back from springer`)
              results.actions.push({
                user_id: user.id,
                action: 'transfer_cases_from_springer',
                status: 'success',
                cases_transferred: transferResponse.data?.transferred_cases?.length || 0
              })
            }
          } catch (transferError) {
            console.error(`      ❌ Transfer function error:`, transferError)
            results.actions.push({
              user_id: user.id,
              action: 'transfer_cases_from_springer',
              status: 'error',
              error: transferError.message
            })
          }

          results.actions.push({
            user_id: user.id,
            action: 'enable_notifications',
            status: 'success'
          })
        }

        results.usersReturnedFromVacation.push({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          legal_area: user.instructor_legal_area,
          vacation_end: user.vacation_end_date
        })
      }
    }

    // 5. Summary
    console.log('\n5. 📋 Daily Vacation Check Summary:')
    console.log(`   🏖️ Users currently on vacation: ${results.usersOnVacation.length}`)
    console.log(`   🎯 Users returned from vacation: ${results.usersReturnedFromVacation.length}`)
    console.log(`   ⚙️ Actions performed: ${results.actions.length}`)
    
    const successfulActions = results.actions.filter(a => a.status === 'success').length
    const failedActions = results.actions.filter(a => a.status === 'error').length
    console.log(`   ✅ Successful actions: ${successfulActions}`)
    console.log(`   ❌ Failed actions: ${failedActions}`)

    console.log('\n🎉 Vacation check completed successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vacation check completed successfully',
        ...results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 Vacation checker error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

/* 
🏖️ VACATION CHECKER EDGE FUNCTION

This function runs daily at 02:00 AM via cron job to:

1. ✅ Find users who should be on vacation today
2. ✅ Disable email notifications for users on vacation
3. ✅ Find users whose vacation has ended
4. ✅ Re-enable notifications and clear vacation dates for returned users
5. ✅ Log all actions and provide detailed summary

CRON SCHEDULE: 0 2 * * * (daily at 02:00 AM)

FEATURES:
- 🔍 Automatic vacation detection based on date ranges
- 🔄 Automatic notification toggle management
- 🧹 Automatic cleanup of expired vacation data
- 📊 Detailed logging and reporting
- ⚡ Error handling and recovery
*/
