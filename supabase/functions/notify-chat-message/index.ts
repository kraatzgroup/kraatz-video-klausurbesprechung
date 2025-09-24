// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessagePayload {
  type: string
  record: {
    id: string
    conversation_id: string
    sender_id: string
    content: string
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

    const payload: ChatMessagePayload = await req.json()
    console.log('Chat message notification payload:', payload)

    if (payload.type !== 'INSERT') {
      return new Response('Not an insert operation', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    const { record } = payload

    // Get conversation participants (excluding sender) - using separate queries to avoid foreign key issues
    const { data: participantIds, error: participantsError } = await supabaseClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', record.conversation_id)
      .neq('user_id', record.sender_id)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return new Response('Error fetching participants', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    if (!participantIds || participantIds.length === 0) {
      console.log('No other participants found')
      return new Response('No participants to notify', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Get user details for participants
    const { data: participants, error: usersError } = await supabaseClient
      .from('users')
      .select('id, email, first_name, last_name, role, email_notifications_enabled')
      .in('id', participantIds.map(p => p.user_id))

    if (usersError) {
      console.error('Error fetching user details:', usersError)
      return new Response('Error fetching user details', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Get sender info
    const { data: sender, error: senderError } = await supabaseClient
      .from('users')
      .select('first_name, last_name, role')
      .eq('id', record.sender_id)
      .single()

    if (senderError) {
      console.error('Error fetching sender:', senderError)
      return new Response('Error fetching sender', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Filter participants who have email notifications enabled
    const notifiableParticipants = participants?.filter(p => 
      p.email_notifications_enabled === true
    ) || []

    console.log(`Found ${notifiableParticipants.length} participants with notifications enabled`)

    if (notifiableParticipants.length === 0) {
      return new Response('No participants with notifications enabled', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Get Mailgun configuration
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = 'kraatz-group.de'
    
    if (!mailgunApiKey) {
      throw new Error('MAILGUN_API_KEY not configured')
    }

    // Send email notifications to each participant using Mailgun
    const emailPromises = notifiableParticipants.map(async (participant) => {
      const user = participant
      if (!user) return null

      const emailSubject = `Neue Chat-Nachricht von ${sender.first_name} ${sender.last_name}`
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">💬 Neue Chat-Nachricht</h2>
          </div>
          
          <div style="padding: 20px; background-color: white; border-radius: 8px; border: 1px solid #e9ecef;">
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Liebe/r ${user.first_name} ${user.last_name},
            </p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Sie haben eine neue Chat-Nachricht von <strong>${sender.first_name} ${sender.last_name}</strong> erhalten.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Nachricht-Details:</h4>
              <p style="margin: 5px 0; color: #555; font-style: italic;">"${record.content}"</p>
              <p style="margin: 5px 0; color: #555;"><strong>Von:</strong> ${sender.first_name} ${sender.last_name}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Gesendet am:</strong> ${new Date(record.created_at).toLocaleString('de-DE')}</p>
            </div>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
              Loggen Sie sich ein, um zu antworten und die Unterhaltung fortzusetzen.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <a href="${Deno.env.get('SITE_URL') || 'https://kraatz-club.netlify.app'}/chat" 
                 style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
                Zum Chat
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px;">
            <p>Diese E-Mail wurde automatisch vom Kraatz-Club System gesendet.</p>
            <p>Bei Fragen wenden Sie sich bitte an das Support-Team.</p>
          </div>
        </div>
      `

      // Prepare form data for Mailgun
      const formData = new FormData()
      formData.append('from', 'Kraatz-Club <postmaster@kraatz-group.de>')
      formData.append('to', user.email)
      formData.append('subject', `[Kraatz-Club] ${emailSubject}`)
      formData.append('html', emailContent)

      // Send email via Mailgun
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
        console.error(`Mailgun error for ${user.email}:`, errorText)
        throw new Error(`Mailgun API error: ${mailgunResponse.status}`)
      }

      const result = await mailgunResponse.json()
      console.log(`✅ Chat notification email sent to ${user.email}:`, result)
      return result
    })

    // Wait for all emails to be sent
    const emailResults = await Promise.all(emailPromises.filter(p => p !== null))

    return new Response(JSON.stringify({
      success: true, 
      message: `Chat notification emails sent to ${notifiableParticipants.length} recipients`,
      recipients: notifiableParticipants.map(p => ({ 
        email: p.email, 
        name: `${p.first_name} ${p.last_name}` 
      })),
      mailgunIds: emailResults.map(r => r.id)
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in notify-chat-message function:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})
