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

    // Get conversation participants (excluding sender)
    const { data: participants, error: participantsError } = await supabaseClient
      .from('conversation_participants')
      .select(`
        user_id,
        users!inner (
          id,
          email,
          first_name,
          last_name,
          role,
          email_notifications_enabled
        )
      `)
      .eq('conversation_id', record.conversation_id)
      .neq('user_id', record.sender_id)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return new Response('Error fetching participants', { 
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
      p.users?.email_notifications_enabled === true
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
      const user = participant.users
      if (!user) return null

      const emailSubject = `Neue Chat-Nachricht von ${sender.first_name} ${sender.last_name}`
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💬 Neue Chat-Nachricht</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Hallo ${user.first_name},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Sie haben eine neue Nachricht von <strong>${sender.first_name} ${sender.last_name}</strong> erhalten:
            </p>
            
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
                "${record.content}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://kraatz-club.de/chat" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;
                        display: inline-block;">
                💬 Chat öffnen
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px; text-align: center;">
              Sie erhalten diese E-Mail, weil Sie Chat-Benachrichtigungen aktiviert haben.<br>
              Sie können diese in Ihren <a href="https://kraatz-club.de/settings" style="color: #667eea;">Einstellungen</a> deaktivieren.
            </p>
          </div>
        </div>
      `

      // Prepare form data for Mailgun
      const formData = new FormData()
      formData.append('from', 'Kraatz Club <noreply@kraatz-group.de>')
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
        email: p.users?.email, 
        name: `${p.users?.first_name} ${p.users?.last_name}` 
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
