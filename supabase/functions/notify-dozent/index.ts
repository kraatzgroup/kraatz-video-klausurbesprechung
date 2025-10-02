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

    // Check if this is an instructor notification by checking the message content
    const isInstructorNotification = 
      notification.message.includes('angefordert') || 
      notification.message.includes('eingereicht') ||
      notification.title.includes('Neue Sachverhalt-Anfrage') ||
      notification.title.includes('Neue Bearbeitung eingereicht')

    if (!isInstructorNotification) {
      return new Response('OK - Not an instructor notification', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Get case study details first to determine the legal area
    let caseStudyDetails = null
    if (!notification.related_case_study_id) {
      console.log('No related case study ID found')
      return new Response('OK - No related case study', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    console.log('Looking for case study with ID:', notification.related_case_study_id)
    
    const { data: caseStudy, error: caseStudyError } = await supabaseClient
      .from('case_study_requests')
      .select('legal_area, sub_area, focus_area, user_id')
      .eq('id', notification.related_case_study_id)
      .single()

    console.log('Case study query result:', { caseStudy, caseStudyError })

    if (caseStudyError || !caseStudy) {
      console.log('Case study not found:', caseStudyError)
      return new Response('OK - Case study not found', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    caseStudyDetails = caseStudy

    // Get student details
    const { data: student } = await supabaseClient
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', caseStudy.user_id)
      .single()

    // Find the instructor responsible for this legal area
    console.log('Looking for instructor with legal area:', caseStudy.legal_area)
    
    const { data: instructor, error: instructorError } = await supabaseClient
      .from('users')
      .select('email, first_name, last_name, role, instructor_legal_area')
      .eq('role', 'instructor')
      .eq('instructor_legal_area', caseStudy.legal_area)
      .single()

    console.log('Instructor query result:', { instructor, instructorError })

    if (instructorError || !instructor) {
      console.log('No instructor found for legal area:', caseStudy.legal_area, instructorError)
      return new Response('OK - No instructor found for this legal area', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Prepare email content
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Ein Student'
    const instructorName = instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Dozent'
    const legalArea = caseStudyDetails?.legal_area || ''
    const subArea = caseStudyDetails?.sub_area || ''
    const focusArea = caseStudyDetails?.focus_area || ''
    
    let emailSubject = notification.title.replace(/📝|📄|🎓|✅|👨‍🏫|🎉|📚/g, '').trim()
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
            Liebe/r ${instructorName},
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            ${notification.message}
          </p>
          
          ${caseStudyDetails ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2e83c2;">
              <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Details:</h4>
              <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Student:</strong> ${studentName}</p>
              <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Rechtsgebiet:</strong> ${legalArea}</p>
              <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Teilbereich:</strong> ${subArea}</p>
              ${focusArea ? `<p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Schwerpunkt/Notiz:</strong> ${focusArea}</p>` : ''}
            </div>
          ` : ''}
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Bitte loggen Sie sich in das Kraatz-Club System ein, um weitere Details zu sehen und entsprechende Maßnahmen zu ergreifen.
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'https://klausuren.kraatz-club.de'}/instructor" 
               style="display: inline-block; background-color: #2e83c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Zum Dozenten-Dashboard
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Diese E-Mail wurde automatisch vom Kraatz-Club System gesendet.</p>
        </div>
      </div>
    `

    // Send email via Mailgun
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = 'kraatz-group.de'
    
    if (!mailgunApiKey) {
      throw new Error('MAILGUN_API_KEY not configured')
    }

    const formData = new FormData()
    formData.append('from', 'Kraatz-Club <postmaster@kraatz-group.de>')
    formData.append('to', instructor.email)
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
        message: 'Email notification sent to instructor',
        mailgunId: mailgunResult.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in notify-dozent function:', error)
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
