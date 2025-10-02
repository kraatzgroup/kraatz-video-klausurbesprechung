import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    console.log(`🔍 Verifying Stripe customer for email: ${email}`)

    // Search for customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      console.log(`❌ No Stripe customer found for email: ${email}`)
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'E-Mail-Adresse nicht im System gefunden. Bitte erstellen Sie zunächst einen Account im Kraatz Club.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const customer = customers.data[0]
    console.log(`✅ Stripe customer found: ${customer.id} for email: ${email}`)

    // Initialize Supabase client for generating magic link
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log(`🔗 Generating magic link for verified email: ${email}`)

    // Generate magic link via Supabase Auth (valid for 30 minutes)
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://kraatz-club.netlify.app'}/dashboard`
      }
    })

    if (authError) {
      console.error(`❌ Error generating magic link: ${authError.message}`)
      return new Response(
        JSON.stringify({ 
          error: 'Fehler beim Generieren des Anmelde-Links',
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
          error: 'Fehler beim Generieren des Anmelde-Links'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Magic link generated successfully`)

    // Send email via Mailgun (same system as other notifications)
    console.log(`📧 Sending magic link email via Mailgun to: ${email}`)

    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = 'kraatz-group.de' // Same as other functions

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

    // Prepare email content (consistent with other Edge Functions)
    const customerName = customer.name || email.split('@')[0]
    const emailSubject = '🔐 Ihr Anmelde-Link für Kraatz Club'
    
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
            Hallo ${customerName},
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            Sie haben einen Anmelde-Link für die Kraatz Club Videobesprechung angefordert.
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="display: inline-block; background-color: #2e83c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
              🔐 Jetzt anmelden
            </a>
          </div>
          
          <!-- Alternative Link zum Kopieren -->
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <p style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">
              <strong>📋 Alternative:</strong> Falls der Button nicht funktioniert, können Sie diesen Link kopieren:
            </p>
            <div style="background-color: #ffffff; padding: 10px; border-radius: 4px; border: 1px solid #ced4da; word-break: break-all; font-family: monospace; font-size: 12px; color: #495057;">
              ${magicLink}
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2e83c2;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">📋 Nächste Schritte:</h4>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Klicken Sie auf den blauen "Jetzt anmelden" Button</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Oder kopieren Sie den Link oben in Ihren Browser</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Sie werden automatisch angemeldet</p>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">• Zugriff auf Ihr persönliches Dashboard</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>🔒 Sicherheitshinweis:</strong><br>
              Dieser Link ist nur für Sie bestimmt und läuft nach <strong>30 Minuten</strong> ab. 
              Teilen Sie diesen Link nicht mit anderen Personen.
            </p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Falls Sie Probleme beim Anmelden haben, antworten Sie einfach auf diese E-Mail.
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
Hallo ${customerName}!

Sie haben einen Anmelde-Link für die Kraatz Club Videobesprechung angefordert.

Anmelde-Link: ${magicLink}

Nächste Schritte:
- Klicken Sie auf den Link oben oder kopieren Sie ihn in Ihren Browser
- Sie werden automatisch angemeldet
- Zugriff auf Ihr persönliches Dashboard
- Klausuren anfordern und Korrekturen einsehen

Sicherheitshinweis:
Dieser Link ist nur für Sie bestimmt und läuft nach 30 MINUTEN ab.
Teilen Sie diesen Link nicht mit anderen Personen.

Falls Sie Probleme beim Anmelden haben, antworten Sie einfach auf diese E-Mail.

Mit freundlichen Grüßen
Ihr Kraatz Club Team

🎓 Kraatz Club - Juristische Exzellenz
https://kraatz-club.de
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
    console.log(`✅ Magic link email sent successfully via Mailgun: ${mailgunResult.id}`)

    return new Response(
      JSON.stringify({ 
        verified: true, 
        customerId: customer.id,
        customerName: customer.name,
        magicLinkSent: true,
        emailId: mailgunResult.id,
        message: 'Anmelde-Link wurde erfolgreich an Ihre E-Mail-Adresse gesendet.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in send-student-magic-link:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Versenden des Anmelde-Links',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
