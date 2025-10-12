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
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'E-Mail-Adresse ist erforderlich' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔍 Verifying admin/dozent user for email: ${email}`)

    // Initialize Supabase client
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

    // Check if user exists in database and has admin/instructor/springer role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name')
      .eq('email', email)
      .in('role', ['admin', 'instructor', 'springer'])
      .single()

    if (userError || !userData) {
      console.log(`❌ No admin/dozent user found for email: ${email}`)
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'E-Mail-Adresse nicht als Admin- oder Dozenten-Account gefunden. Diese Funktion ist nur für berechtigte Benutzer verfügbar.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Admin/Dozent user found: ${userData.id} (${userData.role}) for email: ${email}`)

    console.log(`🔗 Generating password reset link for verified admin/dozent: ${email}`)

    // Generate password reset link via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://klausuren.kraatz-club.de/auth/callback'
      }
    })

    if (authError) {
      console.error(`❌ Error generating password reset link: ${authError.message}`)
      return new Response(
        JSON.stringify({ 
          error: 'Fehler beim Generieren des Passwort-Reset-Links',
          details: authError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const originalResetLink = authData.properties?.action_link
    if (!originalResetLink) {
      console.error(`❌ No password reset link generated`)
      return new Response(
        JSON.stringify({ 
          error: 'Fehler beim Generieren des Passwort-Reset-Links'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📝 Original Supabase reset link:', originalResetLink)

    // Create custom reset link with our domain and callback
    let resetLink = originalResetLink
    
    // Extract token and type from Supabase link
    const tokenMatch = originalResetLink.match(/[?&]token=([^&]+)/)
    const typeMatch = originalResetLink.match(/[?&]type=([^&]+)/)
    
    if (tokenMatch && typeMatch) {
      const token = tokenMatch[1]
      const type = typeMatch[1]
      
      // Create our custom reset link that points to our callback
      resetLink = `https://klausuren.kraatz-club.de/auth/callback?token=${token}&type=${type}`
      
      console.log('✅ Created custom reset link:', resetLink)
    } else {
      console.error('❌ Could not extract token from Supabase reset link')
      // Fallback: try to replace URLs in original link
      resetLink = originalResetLink
        .replace(/https?:\/\/rpgbyockvpannrupicno\.supabase\.co/g, 'https://klausuren.kraatz-club.de')
        .replace(/\/auth\/v1\/verify/g, '/auth/callback')
      
      console.log('⚠️ Using fallback reset link:', resetLink)
    }

    console.log(`✅ Password reset link generated successfully`)

    // Send email via Mailgun
    console.log(`📧 Sending password reset email via Mailgun to: ${email}`)

    // @ts-ignore - Deno runtime API
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = 'kraatz-group.de'

    if (!mailgunApiKey) {
      console.error('❌ Mailgun API key missing')
      return new Response(
        JSON.stringify({ 
          error: 'E-Mail-Konfiguration fehlt'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare email content
    const userName = userData.first_name ? `${userData.first_name} ${userData.last_name}` : email.split('@')[0]
    const roleText = userData.role === 'admin' ? 'Administrator' : userData.role === 'instructor' ? 'Dozent' : 'Springer'
    const emailSubject = '🔐 Passwort zurücksetzen - Kraatz Club'
    
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
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">${emailSubject}</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hallo ${userName},
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Sie haben eine Passwort-Zurücksetzung für Ihren ${roleText}-Account im Kraatz Club angefordert.
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              🔐 Passwort zurücksetzen
            </a>
          </div>
          
          <!-- Alternative Link zum Kopieren -->
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <p style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">
              <strong>📋 Alternative:</strong> Falls der Button nicht funktioniert, können Sie diesen Link kopieren:
            </p>
            <div style="background-color: #ffffff; padding: 10px; border-radius: 4px; border: 1px solid #ced4da; word-break: break-all; font-family: monospace; font-size: 12px; color: #495057;">
              ${resetLink}
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc3545;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">📋 Nächste Schritte:</h4>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Klicken Sie auf den roten "Passwort zurücksetzen" Button</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Oder kopieren Sie den Link oben in Ihren Browser</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Geben Sie Ihr neues Passwort ein</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Melden Sie sich mit dem neuen Passwort an</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>🔒 Sicherheitshinweis:</strong><br>
              Dieser Link ist nur für Sie bestimmt und läuft nach <strong>1 Stunde</strong> ab. 
              Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.
            </p>
          </div>
          
          <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <p style="margin: 0; color: #0c5460; font-size: 14px;">
              <strong>👤 Account-Details:</strong><br>
              E-Mail: ${email}<br>
              Rolle: ${roleText}<br>
              Name: ${userName}
            </p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Falls Sie Probleme beim Zurücksetzen haben oder diese Anfrage nicht von Ihnen stammt, 
            wenden Sie sich bitte an das Support-Team.
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
            Mit freundlichen Grüßen<br>
            <strong>Ihr Kraatz Club Team</strong>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Diese E-Mail wurde automatisch vom Kraatz-Club System gesendet.</p>
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Bei Fragen wende dich bitte an das Support-Team.</p>
        </div>
      </div>`

    const emailText = `
Hallo ${userName}!

Sie haben eine Passwort-Zurücksetzung für Ihren ${roleText}-Account im Kraatz Club angefordert.

Passwort-Reset-Link: ${resetLink}

Nächste Schritte:
- Klicken Sie auf den Link oben oder kopieren Sie ihn in Ihren Browser
- Geben Sie Ihr neues Passwort ein
- Melden Sie sich mit dem neuen Passwort an

Account-Details:
E-Mail: ${email}
Rolle: ${roleText}
Name: ${userName}

Sicherheitshinweis:
Dieser Link ist nur für Sie bestimmt und läuft nach 1 STUNDE ab.
Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.

Falls Sie Probleme beim Zurücksetzen haben oder diese Anfrage nicht von Ihnen stammt, 
wenden Sie sich bitte an das Support-Team.

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

    if (!mailgunResponse.ok) {
      const errorText = await mailgunResponse.text()
      console.error(`❌ Mailgun error: ${errorText}`)
      return new Response(
        JSON.stringify({ 
          error: 'Fehler beim E-Mail-Versand',
          details: errorText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const mailgunResult = await mailgunResponse.json()
    console.log(`✅ Password reset email sent successfully via Mailgun: ${mailgunResult.id}`)

    return new Response(
      JSON.stringify({ 
        verified: true, 
        userId: userData.id,
        userName: userName,
        userRole: userData.role,
        resetLinkSent: true,
        emailId: mailgunResult.id,
        message: 'Passwort-Reset-Link wurde erfolgreich an Ihre E-Mail-Adresse gesendet.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in reset-admin-dozent-password:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Versenden des Passwort-Reset-Links',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
