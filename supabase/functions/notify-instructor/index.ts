// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CaseStudyPayload {
  type: string
  record: {
    id: string
    user_id: string
    legal_area: string
    sub_area: string
    status: string
    created_at: string
    updated_at: string
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

    const payload: CaseStudyPayload = await req.json()
    console.log('Received case study payload:', payload)

    // Only process INSERT events (new case study submissions)
    if (payload.type !== 'INSERT') {
      return new Response('OK - Not an INSERT event', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    const caseStudy = payload.record

    // Get student details
    const { data: student, error: studentError } = await supabaseClient
      .from('users')
      .select('email, first_name, last_name')
      .eq('id', caseStudy.user_id)
      .single()

    if (studentError || !student) {
      console.log('Student not found:', studentError)
      return new Response('OK - Student not found', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Find instructors for this legal area with notifications enabled (supporting both legacy and new format)
    const { data: activeInstructors, error: instructorError } = await supabaseClient
      .from('users')
      .select('email, first_name, last_name, role, instructor_legal_area, legal_areas')
      .eq('role', 'instructor')
      .eq('email_notifications_enabled', true)
      .or(`instructor_legal_area.eq.${caseStudy.legal_area},legal_areas.cs.{${caseStudy.legal_area}}`)

    if (instructorError) {
      console.error('Error fetching instructors:', instructorError)
    }

    let recipientInstructors = activeInstructors || []

    // If no active instructors found, get springer for this legal area
    if (recipientInstructors.length === 0) {
      console.log('No active instructors found, looking for springer...')
      
      const { data: springerUsers, error: springerError } = await supabaseClient
        .from('users')
        .select('email, first_name, last_name, role, instructor_legal_area, legal_areas')
        .eq('role', 'springer')
        .eq('email_notifications_enabled', true)
        .or(`instructor_legal_area.eq.${caseStudy.legal_area},legal_areas.cs.{${caseStudy.legal_area}}`)

      if (springerError) {
        console.error('Error fetching springer:', springerError)
      } else {
        recipientInstructors = springerUsers || []
        console.log(`Found ${recipientInstructors.length} springer for ${caseStudy.legal_area}`)
      }
    }

    if (recipientInstructors.length === 0) {
      console.log('No recipients found for legal area:', caseStudy.legal_area)
      return new Response('OK - No recipients found', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Prepare email content
    const emailSubject = `Neue Klausur-Einreichung: ${caseStudy.legal_area} - ${caseStudy.sub_area}`
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">📝 Neue Klausur-Einreichung</h2>
        </div>
        
        <div style="padding: 20px; background-color: white; border-radius: 8px; border: 1px solid #e9ecef;">
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Liebe Kollegin, lieber Kollege,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            eine neue Klausur wurde zur Korrektur eingereicht und wartet auf Ihre Bearbeitung.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Klausur-Details:</h4>
            <p style="margin: 5px 0; color: #555;"><strong>Student:</strong> ${student.first_name} ${student.last_name}</p>
            <p style="margin: 5px 0; color: #555;"><strong>E-Mail:</strong> ${student.email}</p>
            <p style="margin: 5px 0; color: #555;"><strong>Rechtsgebiet:</strong> ${caseStudy.legal_area}</p>
            <p style="margin: 5px 0; color: #555;"><strong>Teilbereich:</strong> ${caseStudy.sub_area}</p>
            <p style="margin: 5px 0; color: #555;"><strong>Eingereicht am:</strong> ${new Date(caseStudy.created_at).toLocaleString('de-DE')}</p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Bitte loggen Sie sich in das Dozenten-Dashboard ein, um die Klausur zu korrigieren.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/instructor-dashboard" 
               style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              Zum Dozenten-Dashboard
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px;">
          <p>Diese E-Mail wurde automatisch vom Kraatz-Club System gesendet.</p>
          <p>Bei Fragen wenden Sie sich bitte an das Support-Team.</p>
        </div>
      </div>
    `

    // Send email to all recipient instructors/springer
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = 'kraatz-group.de'
    
    if (!mailgunApiKey) {
      throw new Error('MAILGUN_API_KEY not configured')
    }

    const emailPromises = recipientInstructors.map(async (recipient) => {
      const formData = new FormData()
      formData.append('from', 'Kraatz-Club <postmaster@kraatz-group.de>')
      formData.append('to', recipient.email)
      formData.append('subject', `[Kraatz-Club] ${emailSubject}`)
      formData.append('html', emailContent.replace('Liebe Kollegin, lieber Kollege,', `Liebe/r ${recipient.first_name} ${recipient.last_name},`))

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
        console.error(`Mailgun error for ${recipient.email}:`, errorText)
        throw new Error(`Mailgun API error: ${mailgunResponse.status}`)
      }

      const result = await mailgunResponse.json()
      console.log(`Email sent to ${recipient.email} (${recipient.role}):`, result)
      return result
    })

    const emailResults = await Promise.all(emailPromises)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email notifications sent to ${recipientInstructors.length} recipients`,
        recipients: recipientInstructors.map(r => ({ email: r.email, role: r.role })),
        mailgunIds: emailResults.map(r => r.id)
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in notify-instructor function:', error)
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
