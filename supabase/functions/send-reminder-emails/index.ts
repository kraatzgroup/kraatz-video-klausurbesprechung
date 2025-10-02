import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Checking for pending reminder emails...')

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]
    console.log('📅 Today:', today)

    // Find all feedbacks with review_date = today, email_reminder = true, reminder_sent = false
    const { data: pendingReminders, error: fetchError } = await supabaseClient
      .from('student_feedback')
      .select(`
        id,
        review_date,
        mistakes_learned,
        improvements_planned,
        case_study_id,
        user_id,
        users!inner(
          id,
          email,
          first_name,
          last_name
        ),
        case_study_requests!inner(
          id,
          legal_area,
          sub_area,
          focus_area,
          case_study_number
        )
      `)
      .eq('review_date', today)
      .eq('email_reminder', true)
      .eq('reminder_sent', false)

    if (fetchError) {
      console.error('❌ Error fetching pending reminders:', fetchError)
      throw fetchError
    }

    console.log(`📧 Found ${pendingReminders?.length || 0} pending reminders`)

    if (!pendingReminders || pendingReminders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending reminders found',
          count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let successCount = 0
    let errorCount = 0

    // Process each pending reminder
    for (const reminder of pendingReminders) {
      try {
        const user = reminder.users
        const caseStudy = reminder.case_study_requests

        console.log(`📤 Sending reminder to ${user.email}...`)

        // Prepare email content
        const emailSubject = `🎓 Kraatz Club - Wiederholungserinnerung für ${caseStudy.legal_area}`
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎓 Kraatz Club</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Dein Weg zum erfolgreichen Staatsexamen</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #1E40AF; margin-top: 0;">📅 Wiederholungserinnerung</h2>
              
              <p>Hallo ${user.first_name},</p>
              
              <p>heute ist der Tag, an dem du dir vorgenommen hattest, die Inhalte deiner Klausur zu wiederholen!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
                <h3 style="margin-top: 0; color: #1E40AF;">📚 Klausur-Details:</h3>
                <p><strong>Rechtsgebiet:</strong> ${caseStudy.legal_area}</p>
                <p><strong>Teilgebiet:</strong> ${caseStudy.sub_area}</p>
                <p><strong>Schwerpunkt:</strong> ${caseStudy.focus_area}</p>
                <p><strong>Klausur #:</strong> ${caseStudy.case_study_number}</p>
              </div>
              
              <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
                <h4 style="margin-top: 0; color: #DC2626;">💡 Deine Erkenntnisse:</h4>
                <p style="font-style: italic;">"${reminder.mistakes_learned}"</p>
              </div>
              
              <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22C55E;">
                <h4 style="margin-top: 0; color: #16A34A;">🎯 Deine Verbesserungsziele:</h4>
                <p style="font-style: italic;">"${reminder.improvements_planned}"</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.com'}/dashboard" 
                   style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  📖 Zum Dashboard
                </a>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Nutze diese Gelegenheit, um dein Wissen zu festigen und dich optimal auf das Staatsexamen vorzubereiten!
              </p>
              
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              
              <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                Diese E-Mail wurde automatisch von Kraatz Club gesendet.<br>
                Du erhältst diese Nachricht, weil du eine Wiederholungserinnerung aktiviert hast.
              </p>
            </div>
          </div>
        `

        // Send email via Mailgun (same as other notifications)
        const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
        const mailgunDomain = 'kraatz-group.de'
        
        if (!mailgunApiKey) {
          throw new Error('MAILGUN_API_KEY not configured')
        }

        const formData = new FormData()
        formData.append('from', 'Kraatz Club <noreply@kraatz-group.de>')
        formData.append('to', user.email)
        formData.append('subject', `[Kraatz-Club] ${emailSubject}`)
        formData.append('html', emailHtml)

        const emailResponse = await fetch(
          `https://api.eu.mailgun.net/v3/${mailgunDomain}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`
            },
            body: formData
          }
        )

        if (emailResponse.ok) {
          const mailgunResult = await emailResponse.json()
          console.log(`📧 Mailgun response for ${user.email}:`, mailgunResult)
          
          // Mark reminder as sent
          const { error: updateError } = await supabaseClient
            .from('student_feedback')
            .update({ reminder_sent: true })
            .eq('id', reminder.id)

          if (updateError) {
            console.error(`❌ Error marking reminder as sent for ${user.email}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ Reminder sent successfully to ${user.email} (Mailgun ID: ${mailgunResult.id})`)
            successCount++
          }
        } else {
          const errorText = await emailResponse.text()
          console.error(`❌ Mailgun error for ${user.email}:`, errorText)
          console.error(`❌ Status: ${emailResponse.status} ${emailResponse.statusText}`)
          errorCount++
        }

      } catch (error) {
        console.error(`❌ Error processing reminder for user:`, error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${pendingReminders.length} reminders`,
        successCount,
        errorCount,
        totalProcessed: pendingReminders.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error in send-reminder-emails function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
