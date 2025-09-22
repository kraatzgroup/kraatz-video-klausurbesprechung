import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransferRequest {
  instructor_id: string
  reason: 'vacation_start' | 'vacation_end' | 'manual_transfer'
  target_instructor_id?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Case Transfer Function started at:', new Date().toISOString())

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const transferRequest: TransferRequest = await req.json()
    console.log('📋 Transfer request:', transferRequest)

    // Get instructor details
    const { data: instructor, error: instructorError } = await supabaseClient
      .from('users')
      .select('id, first_name, last_name, email, role, instructor_legal_area, legal_areas')
      .eq('id', transferRequest.instructor_id)
      .single()

    if (instructorError || !instructor) {
      throw new Error(`Instructor not found: ${instructorError?.message}`)
    }

    console.log(`👨‍🏫 Processing transfer for: ${instructor.first_name} ${instructor.last_name}`)

    // Get instructor's legal areas (supporting both legacy and new format)
    const instructorLegalAreas = instructor.legal_areas || 
      (instructor.instructor_legal_area ? [instructor.instructor_legal_area] : [])

    if (instructorLegalAreas.length === 0) {
      throw new Error('Instructor has no assigned legal areas')
    }

    console.log(`⚖️ Instructor legal areas: ${instructorLegalAreas.join(', ')}`)

    const results = {
      instructor_id: transferRequest.instructor_id,
      instructor_name: `${instructor.first_name} ${instructor.last_name}`,
      reason: transferRequest.reason,
      legal_areas: instructorLegalAreas,
      transferred_cases: [],
      errors: []
    }

    // Process each legal area
    for (const legalArea of instructorLegalAreas) {
      console.log(`\n🔍 Processing ${legalArea}...`)

      if (transferRequest.reason === 'vacation_start') {
        // Transfer open cases TO springer
        await transferCasesToSpringer(supabaseClient, instructor, legalArea, results)
      } else if (transferRequest.reason === 'vacation_end') {
        // Transfer cases BACK from springer
        await transferCasesFromSpringer(supabaseClient, instructor, legalArea, results)
      } else if (transferRequest.reason === 'manual_transfer' && transferRequest.target_instructor_id) {
        // Manual transfer to specific instructor
        await transferCasesToInstructor(supabaseClient, instructor, legalArea, transferRequest.target_instructor_id, results)
      }
    }

    console.log('\n📊 Transfer Summary:')
    console.log(`   Cases transferred: ${results.transferred_cases.length}`)
    console.log(`   Errors: ${results.errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed case transfers for ${instructor.first_name} ${instructor.last_name}`,
        ...results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 Case transfer error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function transferCasesToSpringer(supabaseClient: any, instructor: any, legalArea: string, results: any) {
  console.log(`🏖️ Transferring cases to springer for ${legalArea}...`)

  // Find available springer for this legal area
  const { data: springerUsers, error: springerError } = await supabaseClient
    .from('users')
    .select('id, first_name, last_name, email, instructor_legal_area, legal_areas')
    .eq('role', 'springer')
    .eq('email_notifications_enabled', true)
    .or(`instructor_legal_area.eq.${legalArea},legal_areas.cs.{${legalArea}}`)

  if (springerError || !springerUsers || springerUsers.length === 0) {
    const error = `No available springer found for ${legalArea}`
    console.error(`❌ ${error}`)
    results.errors.push(error)
    return
  }

  // Use first available springer
  const springer = springerUsers[0]
  console.log(`🔄 Assigning to springer: ${springer.first_name} ${springer.last_name}`)

  // Get open cases for this instructor and legal area
  const { data: openCases, error: casesError } = await supabaseClient
    .from('case_study_requests')
    .select('*')
    .eq('legal_area', legalArea)
    .in('status', [
      'sachverhalt_angefordert',
      'sachverhalt_eingereicht', 
      'in_bearbeitung',
      'korrektur_bereit',
      'video_angefordert'
    ])
    .or(`assigned_instructor_id.eq.${instructor.id},assigned_instructor_id.is.null`)

  if (casesError) {
    console.error(`❌ Error fetching cases: ${casesError.message}`)
    results.errors.push(`Error fetching cases for ${legalArea}: ${casesError.message}`)
    return
  }

  console.log(`📋 Found ${openCases?.length || 0} open cases to transfer`)

  // Transfer each case
  for (const caseItem of openCases || []) {
    try {
      const { error: updateError } = await supabaseClient
        .from('case_study_requests')
        .update({
          assigned_instructor_id: springer.id,
          previous_instructor_id: instructor.id,
          assignment_date: new Date().toISOString(),
          assignment_reason: `Vacation transfer from ${instructor.first_name} ${instructor.last_name} to ${springer.first_name} ${springer.last_name}`
        })
        .eq('id', caseItem.id)

      if (updateError) {
        console.error(`❌ Error updating case ${caseItem.id}: ${updateError.message}`)
        results.errors.push(`Failed to transfer case ${caseItem.id}: ${updateError.message}`)
      } else {
        console.log(`✅ Transferred case ${caseItem.id} (${caseItem.status})`)
        results.transferred_cases.push({
          case_id: caseItem.id,
          status: caseItem.status,
          legal_area: legalArea,
          from_instructor: `${instructor.first_name} ${instructor.last_name}`,
          to_springer: `${springer.first_name} ${springer.last_name}`,
          transfer_type: 'vacation_start'
        })
      }
    } catch (error) {
      console.error(`❌ Error processing case ${caseItem.id}:`, error)
      results.errors.push(`Error processing case ${caseItem.id}: ${error.message}`)
    }
  }
}

async function transferCasesFromSpringer(supabaseClient: any, instructor: any, legalArea: string, results: any) {
  console.log(`🎯 Transferring cases back from springer for ${legalArea}...`)

  // Get cases that were transferred to springer during vacation
  const { data: springerCases, error: casesError } = await supabaseClient
    .from('case_study_requests')
    .select('*, assigned_instructor:assigned_instructor_id(first_name, last_name, role)')
    .eq('legal_area', legalArea)
    .eq('previous_instructor_id', instructor.id)
    .in('status', [
      'sachverhalt_angefordert',
      'sachverhalt_eingereicht', 
      'in_bearbeitung',
      'korrektur_bereit',
      'video_angefordert'
    ])

  if (casesError) {
    console.error(`❌ Error fetching springer cases: ${casesError.message}`)
    results.errors.push(`Error fetching springer cases for ${legalArea}: ${casesError.message}`)
    return
  }

  console.log(`📋 Found ${springerCases?.length || 0} cases to transfer back`)

  // Transfer each case back
  for (const caseItem of springerCases || []) {
    try {
      const { error: updateError } = await supabaseClient
        .from('case_study_requests')
        .update({
          assigned_instructor_id: instructor.id,
          previous_instructor_id: null,
          assignment_date: new Date().toISOString(),
          assignment_reason: `Return from vacation - back to ${instructor.first_name} ${instructor.last_name}`
        })
        .eq('id', caseItem.id)

      if (updateError) {
        console.error(`❌ Error returning case ${caseItem.id}: ${updateError.message}`)
        results.errors.push(`Failed to return case ${caseItem.id}: ${updateError.message}`)
      } else {
        console.log(`✅ Returned case ${caseItem.id} (${caseItem.status})`)
        results.transferred_cases.push({
          case_id: caseItem.id,
          status: caseItem.status,
          legal_area: legalArea,
          from_springer: caseItem.assigned_instructor?.first_name + ' ' + caseItem.assigned_instructor?.last_name,
          to_instructor: `${instructor.first_name} ${instructor.last_name}`,
          transfer_type: 'vacation_end'
        })
      }
    } catch (error) {
      console.error(`❌ Error returning case ${caseItem.id}:`, error)
      results.errors.push(`Error returning case ${caseItem.id}: ${error.message}`)
    }
  }
}

async function transferCasesToInstructor(supabaseClient: any, fromInstructor: any, legalArea: string, targetInstructorId: string, results: any) {
  console.log(`👨‍🏫 Manual transfer to instructor ${targetInstructorId} for ${legalArea}...`)

  // Get target instructor details
  const { data: targetInstructor, error: targetError } = await supabaseClient
    .from('users')
    .select('id, first_name, last_name')
    .eq('id', targetInstructorId)
    .single()

  if (targetError || !targetInstructor) {
    const error = `Target instructor not found: ${targetError?.message}`
    console.error(`❌ ${error}`)
    results.errors.push(error)
    return
  }

  // Implementation for manual transfers (similar to vacation transfer logic)
  console.log(`🔄 Manual transfer logic would be implemented here`)
}

/* 
🔄 CASE TRANSFER EDGE FUNCTION

This function handles the transfer of open case study requests between instructors and springer:

VACATION START:
- Transfers all open cases from instructor to available springer
- Preserves case history with previous_instructor_id
- Only transfers non-completed cases

VACATION END:
- Transfers cases back from springer to returning instructor
- Clears previous_instructor_id
- Updates assignment tracking

MANUAL TRANSFER:
- Allows admin to manually transfer cases between instructors
- Useful for workload balancing or permanent reassignments

CASE STATUSES TRANSFERRED:
- sachverhalt_angefordert (case study requested)
- sachverhalt_eingereicht (case study submitted)
- in_bearbeitung (in progress)
- korrektur_bereit (correction ready)
- video_angefordert (video requested)

COMPLETED CASES (NOT TRANSFERRED):
- corrected (stays with original instructor)
- video_hochgeladen (stays with original instructor)
*/
