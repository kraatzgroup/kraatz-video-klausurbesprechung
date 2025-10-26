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

    console.log(`🔐 Password reset request for: ${email}`)

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
          'X-Client-Info': 'kraatz-club-password-reset'
        }
      }
    })

    // Check if user exists in our database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, instructor_legal_area')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.log(`❌ User not found in database: ${email}`)
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Falls ein Account mit dieser E-Mail-Adresse existiert, wurde eine Reset-E-Mail gesendet.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ User found: ${user.email} (${user.role})`)

    // Generate magic link that logs user in and redirects to profile
    console.log('🔐 Generating magic link for direct login...')
    
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: 'https://klausuren.kraatz-club.de/profile'
      }
    })

    if (authError) {
      console.error(`❌ Error generating magic link: ${authError.message}`)
      return new Response(
        JSON.stringify({ 
          error: 'Fehler beim Generieren des Login-Links',
          details: authError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const magicLink = authData.properties?.action_link
    if (!magicLink) {
      console.error(`❌ No magic link generated`)
      return new Response(
        JSON.stringify({ 
          error: 'Fehler beim Generieren des Login-Links'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use the magic link directly - it will auto-login and redirect to profile
    const resetLink = magicLink
    
    console.log('✅ Created magic login link:', resetLink)

    console.log(`✅ Password reset link generated successfully`)

    // Send styled email via Mailgun
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

    // Determine role display name
    const roleDisplayName = user.role === 'instructor' ? 'Dozent' : 
                           user.role === 'springer' ? 'Springer' : 
                           user.role === 'admin' ? 'Administrator' : user.role

    const userName = `${user.first_name} ${user.last_name}`
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
            Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für den Kraatz Club gestellt.
          </p>

          ${user.instructor_legal_area ? `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2e83c2;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">👤 Ihr Account:</h4>
            <p style="margin: 0; color: #555; font-size: 14px;"><strong>Rolle:</strong> ${roleDisplayName}</p>
            <p style="margin: 0; color: #555; font-size: 14px;"><strong>Rechtsgebiet:</strong> ${user.instructor_legal_area}</p>
          </div>
          ` : `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2e83c2;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">👤 Ihr Account:</h4>
            <p style="margin: 0; color: #555; font-size: 14px;"><strong>Rolle:</strong> ${roleDisplayName}</p>
          </div>
          `}
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            <strong>Klicken Sie auf den Button unten, um sich direkt anzumelden:</strong><br>
            <em>Sie werden automatisch angemeldet und zu Ihrem Profil weitergeleitet.</em>
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background-color: #2e83c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              🔐 Direkt anmelden
            </a>
          </div>
          
          <!-- Alternative Link -->
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <p style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">
              <strong>📋 Alternative:</strong> Falls der Button nicht funktioniert, können Sie diesen Link kopieren:
            </p>
            <div style="background-color: #ffffff; padding: 10px; border-radius: 4px; border: 1px solid #ced4da; word-break: break-all; font-family: monospace; font-size: 12px; color: #495057;">
              ${resetLink}
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2e83c2;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">📋 Nächste Schritte:</h4>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Klicken Sie auf den blauen "Direkt anmelden" Button</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Sie werden automatisch angemeldet</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Sie werden zu Ihrem Profil weitergeleitet</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Dort können Sie Ihr Passwort in den Einstellungen ändern</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>🔒 Sicherheitshinweis:</strong><br>
              Dieser Reset-Link ist nur für Sie bestimmt und läuft nach <strong>1 Stunde</strong> ab. 
              Teilen Sie diesen Link nicht mit anderen Personen.
            </p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
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
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Bei Fragen wende dich bitte an das Support-Team.</p>
        </div>
      </div>`

    const emailText = `
Passwort zurücksetzen - Kraatz Club

Hallo ${userName}!

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für den Kraatz Club gestellt.

Ihr Account:
- Rolle: ${roleDisplayName}
${user.instructor_legal_area ? `- Rechtsgebiet: ${user.instructor_legal_area}` : ''}

Reset-Link: ${resetLink}

Nächste Schritte:
- Klicken Sie auf den Link oben oder kopieren Sie ihn in Ihren Browser
- Geben Sie Ihr neues Passwort ein
- Melden Sie sich mit Ihren neuen Zugangsdaten an
- Zugriff auf Ihr ${roleDisplayName}-Dashboard

Sicherheitshinweis:
Dieser Link ist nur für Sie bestimmt und läuft nach 1 STUNDE ab.
Teilen Sie diesen Link nicht mit anderen Personen.

Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.

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
        success: true,
        message: 'Eine E-Mail zum Zurücksetzen des Passworts wurde an Ihre E-Mail-Adresse gesendet.',
        emailId: mailgunResult.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in send-password-reset:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Versenden der Reset-E-Mail',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
