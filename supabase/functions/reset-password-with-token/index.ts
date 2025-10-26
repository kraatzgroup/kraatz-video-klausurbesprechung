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
    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token und neues Passwort sind erforderlich' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Das Passwort muss mindestens 6 Zeichen lang sein' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔐 Resetting password with token: ${token}`)

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

    // Validate token first
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select(`
        id,
        user_id,
        expires_at,
        used,
        users!inner(email)
      `)
      .eq('token', token)
      .eq('used', false)
      .single()

    if (tokenError || !tokenData) {
      console.log(`❌ Token not found or already used: ${token}`)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token nicht gefunden oder bereits verwendet'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if token has expired
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      console.log(`❌ Token expired: ${token}`)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Token ist abgelaufen'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Token is valid, resetting password for user: ${tokenData.users.email}`)

    // Reset the password using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { 
        password: newPassword,
        email_confirm: true
      }
    )

    if (authError) {
      console.error(`❌ Password reset failed: ${authError.message}`)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Fehler beim Zurücksetzen des Passworts: ${authError.message}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from('password_reset_tokens')
      .update({ 
        used: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.id)

    if (updateError) {
      console.warn(`⚠️ Could not mark token as used: ${updateError.message}`)
      // Don't fail the password reset for this
    }

    console.log(`✅ Password reset successful for user: ${tokenData.users.email}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Passwort erfolgreich zurückgesetzt',
        email: tokenData.users.email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in reset-password-with-token:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Fehler beim Zurücksetzen des Passworts'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
