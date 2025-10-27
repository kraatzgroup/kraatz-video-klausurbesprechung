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
    const { email, password, firstName, lastName, role, instructorLegalArea } = await req.json()

    if (!email || !password || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, password, firstName, lastName, and role are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`👤 Creating user: ${email} with role: ${role}`)

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
          'X-Client-Info': 'kraatz-club-create-user'
        }
      }
    })

    // Validate that instructors and springer have a legal area
    if ((role === 'instructor' || role === 'springer') && !instructorLegalArea) {
      return new Response(
        JSON.stringify({ error: 'Instructors and Springer must have a legal area specified' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      },
      email_confirm: true
    })

    if (authError) {
      console.error(`❌ Auth creation failed: ${authError.message}`)
      return new Response(
        JSON.stringify({ 
          error: `Auth creation failed: ${authError.message}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Auth user created: ${authData.user.id}`)

    // Wait for potential trigger
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if user record exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    // Create user record if it doesn't exist
    if (!existingUser) {
      console.log('📝 Creating user record manually...')
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: role,
          instructor_legal_area: (role === 'instructor' || role === 'springer') ? instructorLegalArea : null,
          legal_areas: (role === 'instructor' || role === 'springer') ? 
            (instructorLegalArea ? [instructorLegalArea] : null) : null,
          account_credits: role === 'student' ? 0 : null
        })

      if (insertError) {
        console.error('❌ User record creation failed:', insertError)
        return new Response(
          JSON.stringify({ 
            error: `Failed to create user record: ${insertError.message}`
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Get final user record
    const { data: finalUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    console.log('✅ User record verified:', finalUser)

    // Send welcome email ONLY for instructor, springer, and admin roles - NOT for students
    if (role === 'instructor' || role === 'springer' || role === 'admin') {
      try {
        console.log(`📧 Sending welcome email to ${role}...`)
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: email,
            firstName: firstName,
            lastName: lastName,
            role: role,
            legalArea: instructorLegalArea || null
          }
        })

        if (emailError) {
          console.warn('⚠️ Welcome email failed:', emailError)
        } else {
          console.log('✅ Welcome email sent:', emailData)
        }
      } catch (emailError) {
        console.warn('⚠️ Welcome email error:', emailError)
      }
    } else {
      console.log(`ℹ️ Skipping welcome email for role: ${role} (only sent to instructor/springer/admin)`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: authData.user,
        createdUser: finalUser,
        message: `User ${email} created successfully with role ${role}. Welcome email sent.`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in create-admin-user:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create user',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
