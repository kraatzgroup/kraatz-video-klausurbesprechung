// @ts-ignore - Deno runtime modules
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno runtime modules
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
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Token ist erforderlich' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔐 Validating reset token: ${token}`)

    // Initialize Supabase admin client
    // @ts-ignore - Deno runtime API
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // @ts-ignore - Deno runtime API
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if token exists and is valid
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select(`
        id,
        user_id,
        expires_at,
        used,
        users!inner(email, first_name, last_name)
      `)
      .eq('token', token)
      .eq('used', false)
      .single()

    if (tokenError || !tokenData) {
      console.log(`❌ Token not found or already used: ${token}`)
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Token nicht gefunden oder bereits verwendet'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if token has expired
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      console.log(`❌ Token expired: ${token} (expired at ${expiresAt.toISOString()})`)
      return new Response(
        JSON.stringify({ 
          valid: false,
          error: 'Token ist abgelaufen'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Token is valid for user: ${tokenData.users.email}`)

    return new Response(
      JSON.stringify({ 
        valid: true,
        email: tokenData.users.email,
        name: `${tokenData.users.first_name} ${tokenData.users.last_name}`,
        userId: tokenData.user_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in validate-reset-token:', error)
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: 'Fehler beim Validieren des Tokens'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
