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
    const { email, firstName, lastName, role, legalArea } = await req.json()

    if (!email || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: 'E-Mail, Name und Rolle sind erforderlich' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🎉 Sending welcome email to new ${role}: ${email}`)

    // Initialize Supabase client for generating magic link
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
          'X-Client-Info': 'kraatz-club-welcome-email'
        }
      }
    })

    console.log(`🔗 Generating password reset link for new user: ${email}`)

    // Generate password reset link (valid for 1 hour)
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

    // Create custom reset link with our domain
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

    // Send welcome email via Mailgun
    console.log(`📧 Sending welcome email via Mailgun to: ${email}`)

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
    const roleDisplayName = role === 'instructor' ? 'Dozent' : 
                           role === 'springer' ? 'Springer' : 
                           role === 'admin' ? 'Administrator' : role

    const userName = `${firstName} ${lastName}`
    const emailSubject = `🎉 Willkommen im Kraatz Club - Ihr ${roleDisplayName}-Account wurde erstellt`
    
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
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">🎉 Ihr ${roleDisplayName}-Account wurde erfolgreich erstellt</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hallo ${userName},
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            herzlich willkommen im Kraatz Club! Ihr ${roleDisplayName}-Account wurde erfolgreich erstellt und Sie können jetzt auf das System zugreifen.
          </p>

          ${legalArea ? `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2e83c2;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">📚 Ihr Fachbereich:</h4>
            <p style="margin: 0; color: #555; font-size: 16px; font-weight: bold;">${legalArea}</p>
          </div>
          ` : ''}
          
          <!-- Account Details -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2e83c2;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">👤 Ihre Account-Details:</h4>
            <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>E-Mail:</strong> ${email}</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Name:</strong> ${userName}</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Rolle:</strong> ${roleDisplayName}</p>
            ${legalArea ? `<p style="margin: 8px 0; color: #555; font-size: 14px;"><strong>Rechtsgebiet:</strong> ${legalArea}</p>` : ''}
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            <strong>🔐 Wichtig:</strong> Aus Sicherheitsgründen müssen Sie zunächst ein neues Passwort festlegen. 
            Klicken Sie dazu auf den Button unten:
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background-color: #2e83c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              🔐 Passwort festlegen
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
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Klicken Sie auf den blauen "Passwort festlegen" Button</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Wählen Sie ein sicheres neues Passwort</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Melden Sie sich mit Ihren neuen Zugangsdaten an</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Erkunden Sie Ihr ${roleDisplayName}-Dashboard</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>🔒 Sicherheitshinweis:</strong><br>
              Dieser Passwort-Reset-Link ist nur für Sie bestimmt und läuft nach <strong>1 Stunde</strong> ab. 
              Teilen Sie diesen Link nicht mit anderen Personen. Nach dem ersten Login sollten Sie Ihr Passwort ändern.
            </p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Falls Sie Fragen haben oder Hilfe benötigen, antworten Sie einfach auf diese E-Mail oder wenden Sie sich an das Support-Team.
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
Willkommen im Kraatz Club!

Hallo ${userName}!

Herzlich willkommen im Kraatz Club! Ihr ${roleDisplayName}-Account wurde erfolgreich erstellt.

Account-Details:
- E-Mail: ${email}
- Name: ${userName}
- Rolle: ${roleDisplayName}
${legalArea ? `- Rechtsgebiet: ${legalArea}` : ''}

WICHTIG - Passwort festlegen:
Aus Sicherheitsgründen müssen Sie zunächst ein neues Passwort festlegen.

Passwort-Reset-Link: ${resetLink}

Nächste Schritte:
1. Klicken Sie auf den Link oben oder kopieren Sie ihn in Ihren Browser
2. Wählen Sie ein sicheres neues Passwort
3. Melden Sie sich mit Ihren neuen Zugangsdaten an
4. Erkunden Sie Ihr ${roleDisplayName}-Dashboard

Sicherheitshinweis:
Dieser Link ist nur für Sie bestimmt und läuft nach 1 STUNDE ab.
Teilen Sie diesen Link nicht mit anderen Personen.
Nach dem ersten Login sollten Sie Ihr Passwort ändern.

Falls Sie Fragen haben, antworten Sie einfach auf diese E-Mail.

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
    console.log(`✅ Welcome email sent successfully via Mailgun: ${mailgunResult.id}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        userName: userName,
        userRole: roleDisplayName,
        userEmail: email,
        legalArea: legalArea,
        welcomeEmailSent: true,
        emailId: mailgunResult.id,
        message: `Willkommens-E-Mail wurde erfolgreich an ${email} gesendet.`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in send-welcome-email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Versenden der Willkommens-E-Mail',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
