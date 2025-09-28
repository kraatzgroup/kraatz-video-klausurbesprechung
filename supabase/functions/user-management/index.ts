/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userData, userId, newRole, credits } = await req.json()

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || userProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result

    switch (action) {
      case 'create':
        // Create new user in auth.users first
        const { data: authUser, error: authCreateError } = await supabaseClient.auth.admin.createUser({
          email: userData.email,
          password: userData.password || 'TempPassword123!',
          email_confirm: true
        })

        if (authCreateError) {
          throw authCreateError
        }

        // Then create user in public.users table
        const { error: createError } = await supabaseClient
          .from('users')
          .insert({
            id: authUser.user.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            account_credits: userData.role === 'student' ? 0 : 1000
          })

        if (createError) {
          // If public.users insert fails, clean up auth user
          await supabaseClient.auth.admin.deleteUser(authUser.user.id)
          throw createError
        }

        result = { message: 'User created successfully', userId: authUser.user.id }
        break

      case 'update_role':
        // Update user role
        const { error: updateError } = await supabaseClient
          .from('users')
          .update({ role: newRole })
          .eq('id', userId)

        if (updateError) {
          throw updateError
        }

        result = { message: 'User role updated successfully' }
        break

      case 'grant_credits':
        // Grant credits to user
        const { data: currentUser, error: fetchError } = await supabaseClient
          .from('users')
          .select('account_credits')
          .eq('id', userId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        const { error: creditError } = await supabaseClient
          .from('users')
          .update({ account_credits: (currentUser.account_credits || 0) + credits })
          .eq('id', userId)

        if (creditError) {
          throw creditError
        }

        result = { message: 'Credits granted successfully' }
        break

      case 'delete':
        // Delete user (only if not admin)
        const { data: targetUser, error: targetError } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', userId)
          .single()

        if (targetError) {
          throw targetError
        }

        if (targetUser.role === 'admin') {
          return new Response(
            JSON.stringify({ error: 'Cannot delete admin users' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: deleteError } = await supabaseClient
          .from('users')
          .delete()
          .eq('id', userId)

        if (deleteError) {
          throw deleteError
        }

        result = { message: 'User deleted successfully' }
        break

      case 'list':
        // List all users with stats
        const { data: allUsers, error: listError } = await supabaseClient
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (listError) {
          throw listError
        }

        // Get case study requests for stats
        const { data: requests, error: requestsError } = await supabaseClient
          .from('case_study_requests')
          .select('user_id, status')

        if (requestsError) {
          throw requestsError
        }

        // Calculate stats for each user
        const usersWithStats = allUsers.map(user => {
          const userRequests = requests?.filter(req => req.user_id === user.id) || []
          const completedCases = userRequests.filter(req => req.status === 'corrected').length
          const pendingCases = userRequests.filter(req => req.status !== 'corrected').length

          return {
            ...user,
            totalRequests: userRequests.length,
            completedCases,
            pendingCases
          }
        })

        result = { users: usersWithStats }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
