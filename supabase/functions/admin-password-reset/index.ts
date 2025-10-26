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
    const { email, newPassword, adminUserId } = await req.json()

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Email and newPassword are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔐 Admin password reset request for: ${email}`)

    // Initialize Supabase admin client
    // @ts-ignore - Deno runtime API
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // @ts-ignore - Deno runtime API
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'X-Client-Info': 'kraatz-club-admin-password-reset'
        }
      }
    })

    // Verify the admin user has permission (optional - for extra security)
    if (adminUserId) {
      const { data: adminUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', adminUserId)
        .single()

      if (!adminUser || adminUser.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Admin access required' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Find the user to reset
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name')
      .eq('email', email)
      .single()

    if (userError || !targetUser) {
      console.error(`❌ User not found: ${email}`)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`👤 Found user: ${targetUser.email} (${targetUser.role})`)

    // Reset password using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { 
        password: newPassword,
        email_confirm: true // Ensure email is confirmed
      }
    )

    if (authError) {
      console.error(`❌ Password reset failed: ${authError.message}`)
      return new Response(
        JSON.stringify({ 
          error: `Password reset failed: ${authError.message}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Password reset successful for: ${email}`)

    // Optionally send notification email
    try {
      console.log('📧 Sending password reset notification...')
      
      // @ts-ignore - Deno runtime API
      const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
      const mailgunDomain = 'kraatz-group.de'

      if (mailgunApiKey) {
        const roleDisplayName = targetUser.role === 'instructor' ? 'Dozent' : 
                               targetUser.role === 'springer' ? 'Springer' : 
                               targetUser.role === 'admin' ? 'Administrator' : targetUser.role

        const userName = `${targetUser.first_name} ${targetUser.last_name}`
        const emailSubject = `🔐 Ihr Passwort wurde zurückgesetzt - Kraatz Club`
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #e9ecef;">
              <img src="https://rpgbyockvpannrupicno.supabase.co/storage/v1/object/public/images/logos/9674199.png" 
                   alt="Kraatz-Club Logo" 
                   style="height: 60px; margin: 0 auto; display: block;">
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px 20px; background-color: white;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">🔐 Ihr Passwort wurde zurückgesetzt</h2>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hallo ${userName},
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Ihr Passwort für den Kraatz Club wurde erfolgreich von einem Administrator zurückgesetzt.
              </p>

              <!-- Account Details -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2e83c2;">
                <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">👤 Ihre Account-Details:</h4>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>E-Mail:</strong> ${email}</p>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Name:</strong> ${userName}</p>
                <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Rolle:</strong> ${roleDisplayName}</p>
              </div>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
              </p>
              
              <!-- Login Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://klausuren.kraatz-club.de/admin-login" 
                   style="display: inline-block; background-color: #2e83c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
                  🔐 Jetzt anmelden
                </a>
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>🔒 Sicherheitshinweis:</strong><br>
                  Aus Sicherheitsgründen empfehlen wir Ihnen, Ihr Passwort nach der ersten Anmeldung zu ändern.
                </p>
              </div>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Falls Sie Fragen haben, wenden Sie sich an das Support-Team.
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                Mit freundlichen Grüßen<br>
                <strong>Ihr Kraatz Club Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; font-size: 12px; margin: 5px 0;">🎓 Kraatz Club - Juristische Exzellenz</p>
              <p style="color: #666; font-size: 12px; margin: 5px 0;">Diese E-Mail wurde automatisch vom Kraatz-Club System gesendet.</p>
            </div>
          </div>`

        const emailText = `
Ihr Passwort wurde zurückgesetzt

Hallo ${userName}!

Ihr Passwort für den Kraatz Club wurde erfolgreich von einem Administrator zurückgesetzt.

Account-Details:
- E-Mail: ${email}
- Name: ${userName}
- Rolle: ${roleDisplayName}

Sie können sich jetzt mit Ihrem neuen Passwort anmelden:
https://klausuren.kraatz-club.de/admin-login

Sicherheitshinweis:
Aus Sicherheitsgründen empfehlen wir Ihnen, Ihr Passwort nach der ersten Anmeldung zu ändern.

Mit freundlichen Grüßen
Ihr Kraatz Club Team

🎓 Kraatz Club - Juristische Exzellenz
https://klausuren.kraatz-club.de
`

        // Send email via Mailgun
        const formData = new FormData()
        formData.append('from', 'Kraatz-Club <postmaster@kraatz-group.de>')
        formData.append('to', email)
        formData.append('subject', `[Kraatz-Club] ${emailSubject}`)
        formData.append('text', emailText)
        formData.append('html', emailHtml)

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

        if (mailgunResponse.ok) {
          const mailgunResult = await mailgunResponse.json()
          console.log(`✅ Notification email sent: ${mailgunResult.id}`)
        } else {
          console.warn('⚠️ Failed to send notification email')
        }
      }
    } catch (emailError) {
      console.warn('⚠️ Email notification error:', emailError)
      // Don't fail the password reset if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Password successfully reset for ${email}`,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          role: targetUser.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in admin-password-reset:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to reset password',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
