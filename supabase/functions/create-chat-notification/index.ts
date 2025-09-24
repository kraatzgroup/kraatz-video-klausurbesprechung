// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatNotificationPayload {
  recipientId: string
  senderName: string
  messageContent: string
  conversationId: string
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

    const payload: ChatNotificationPayload = await req.json()
    console.log('Creating chat notification:', payload)

    const { recipientId, senderName, messageContent, conversationId } = payload

    // Create notification
    const { error } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: recipientId,
        title: '💬 Neue Chat-Nachricht',
        message: `${senderName}: ${messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}`,
        type: 'info',
        related_case_study_id: conversationId,
        read: false
      })

    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }

    console.log('✅ Chat notification created successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Chat notification created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-chat-notification function:', error)
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
