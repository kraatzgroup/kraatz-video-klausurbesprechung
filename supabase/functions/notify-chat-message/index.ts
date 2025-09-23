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

    // Send email notifications to each participant
    for (const participant of notifiableParticipants) {
      const user = participant.users
      if (!user) continue

      const emailData = {
        to: user.email,
        subject: `Neue Chat-Nachricht von ${sender.first_name} ${sender.last_name}`,
        html: `
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
      }

      // Send email via Resend
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kraatz Club <noreply@kraatz-club.de>',
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
        }),
      })

      if (!emailResponse.ok) {
        console.error(`Failed to send email to ${user.email}:`, await emailResponse.text())
      } else {
        console.log(`✅ Chat notification email sent to ${user.email}`)
      }
    }

    return new Response('Chat notifications sent successfully', { 
      status: 200, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Error in notify-chat-message function:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})
