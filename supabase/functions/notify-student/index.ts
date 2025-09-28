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
      actionButton = `
        <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/dashboard" 
           style="display: inline-block; background-color: #2e83c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; font-weight: 500;">
          Sachverhalt ansehen
        </a>
      `
    } else if (notification.message.includes('Korrektur') && notification.message.includes('verfügbar')) {
      actionButton = `
        <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/dashboard" 
           style="display: inline-block; background-color: #2e83c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
          Korrektur ansehen
        </a>
      `
    } else if (notification.message.includes('eingereicht')) {
      actionButton = `
        <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/dashboard" 
           style="display: inline-block; background-color: #2e83c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
          Zum Dashboard
        </a>
      `
    } else {
      actionButton = `
        <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/dashboard" 
           style="display: inline-block; background-color: #2e83c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
          Zum Dashboard
        </a>
      `
    }

    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #e9ecef;">
          <img src="https://rpgbyockvpannrupicno.supabase.co/storage/v1/object/public/images/logos/9674199.png" 
               alt="Kraatz-Club Logo" 
               style="height: 60px; margin: 0 auto; display: block;">
        </div>
        
        <!-- Main Content -->
        <div style="padding: 30px 20px; background-color: white;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">${emailSubject}</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hallo ${student.first_name},
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            ${notification.message}
          </p>
          
          ${caseStudyDetails ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2e83c2;">
              <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Klausur-Details:</h4>
              <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Rechtsgebiet:</strong> ${caseStudyDetails.legal_area}</p>
              <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Teilbereich:</strong> ${caseStudyDetails.sub_area}</p>
              <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Dozent:</strong> ${instructorName}</p>
            </div>
          ` : ''}
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            ${actionButton}
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Diese E-Mail wurde automatisch vom Kraatz-Club System gesendet.</p>
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Bei Fragen wende dich bitte an deinen Dozenten oder das Support-Team.</p>
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
