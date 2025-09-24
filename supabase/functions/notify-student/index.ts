// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  type: string
  record: {
    id: string
    user_id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    related_case_study_id?: string
    created_at: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: NotificationPayload = await req.json()
    console.log('Received notification payload:', payload)

    // Only process INSERT events (new notifications)
    if (payload.type !== 'INSERT') {
      return new Response('OK - Not an INSERT event', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    const notification = payload.record

    // Check if this is a student notification by checking the message content
    const isStudentNotification = 
      notification.message.includes('verfügbar') || 
      notification.message.includes('Korrektur') ||
      notification.message.includes('abgeschlossen') ||
      notification.title.includes('Sachverhalt verfügbar') ||
      notification.title.includes('Korrektur verfügbar') ||
      notification.title.includes('Klausur abgeschlossen') ||
      notification.title.includes('Bearbeitung eingereicht') ||
      notification.title.includes('Korrektur in Bearbeitung')

    if (!isStudentNotification) {
      return new Response('OK - Not a student notification', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseClient
      .from('users')
      .select('email, first_name, last_name, role')
      .eq('id', notification.user_id)
      .eq('role', 'student')
      .single()

    if (studentError || !student) {
      console.log('User is not a student or not found:', studentError)
      return new Response('OK - User is not a student', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Get case study details if available
    let caseStudyDetails = null
    let instructorName = ''
    if (notification.related_case_study_id) {
      const { data: caseStudy } = await supabaseClient
        .from('case_study_requests')
        .select(`
          legal_area,
          sub_area,
          status,
          users!case_study_requests_instructor_id_fkey(full_name)
        `)
        .eq('id', notification.related_case_study_id)
        .single()

      caseStudyDetails = caseStudy
      instructorName = caseStudy?.users?.full_name || 'Dein Dozent'
    }

    // Prepare email content based on notification type
    let emailSubject = notification.title.replace(/📝|📄|🎓|✅|👨‍🏫|🎉|📚/g, '').trim()
    let actionButton = ''
    let actionText = ''

    // Determine the appropriate action based on the notification
    if (notification.message.includes('verfügbar') && !notification.message.includes('Korrektur')) {
      actionText = 'Du kannst jetzt mit der Bearbeitung beginnen.'
      actionButton = `
        <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/dashboard" 
           style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
          Sachverhalt ansehen
        </a>
      `
    } else if (notification.message.includes('Korrektur') && notification.message.includes('verfügbar')) {
      actionText = 'Deine Korrektur ist jetzt verfügbar. Schaue dir das Video und die schriftliche Bewertung an.'
      actionButton = `
        <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/dashboard" 
           style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
          Korrektur ansehen
        </a>
      `
    } else if (notification.message.includes('eingereicht')) {
      actionText = 'Deine Bearbeitung wurde erfolgreich eingereicht. Die Korrektur erfolgt innerhalb von 48 Stunden.'
      actionButton = `
        <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/dashboard" 
           style="display: inline-block; background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
          Zum Dashboard
        </a>
      `
    } else {
      actionText = 'Logge dich ein, um weitere Details zu sehen.'
      actionButton = `
        <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/dashboard" 
           style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
          Zum Dashboard
        </a>
      `
    }

    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">${emailSubject}</h2>
        </div>
        
        <div style="padding: 20px; background-color: white; border-radius: 8px; border: 1px solid #e9ecef;">
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Liebe/r ${student.first_name} ${student.last_name},
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            ${notification.message}
          </p>
          
          ${caseStudyDetails ? `
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Klausur-Details:</h4>
              <p style="margin: 5px 0; color: #555;"><strong>Rechtsgebiet:</strong> ${caseStudyDetails.legal_area}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Teilbereich:</strong> ${caseStudyDetails.sub_area}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Dozent:</strong> ${instructorName}</p>
            </div>
          ` : ''}
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            ${actionText}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            ${actionButton}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px;">
          <p>Diese E-Mail wurde automatisch vom Kraatz-Club System gesendet.</p>
          <p>Bei Fragen wende dich bitte an deinen Dozenten oder das Support-Team.</p>
        </div>
      </div>
    `

    // Send email via Mailgun
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = 'kraatz-group.de' // Updated to correct domain
    
    if (!mailgunApiKey) {
      throw new Error('MAILGUN_API_KEY not configured')
    }

    const formData = new FormData()
    formData.append('from', 'Kraatz-Club <postmaster@kraatz-group.de>')
    formData.append('to', student.email)
    formData.append('subject', `[Kraatz-Club] ${emailSubject}`)
    formData.append('html', emailContent)

    const mailgunResponse = await fetch(
      `https://api.eu.mailgun.net/v3/${mailgunDomain}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`
        },
        body: formData
      }
    )

    if (!mailgunResponse.ok) {
      const errorText = await mailgunResponse.text()
      console.error('Mailgun error:', errorText)
      throw new Error(`Mailgun API error: ${mailgunResponse.status}`)
    }

    const mailgunResult = await mailgunResponse.json()
    console.log('Email sent successfully:', mailgunResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent to student',
        mailgunId: mailgunResult.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in notify-student function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
