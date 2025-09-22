import { createClient } from '@supabase/supabase-js'

// Create admin client for notification operations
const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co',
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
)

interface CaseStudyNotificationData {
  id: string
  user_id: string
  legal_area: string
  sub_area: string
  status: string
  created_at: string
}

export async function sendInstructorNotification(caseStudyData: CaseStudyNotificationData) {
  try {
    console.log('Sending instructor notification for case study:', caseStudyData.id)

    // Call the Supabase Edge Function
    const { data, error } = await supabaseAdmin.functions.invoke('notify-instructor', {
      body: {
        type: 'INSERT',
        record: caseStudyData
      }
    })

    if (error) {
      console.error('Error calling notify-instructor function:', error)
      throw error
    }

    console.log('Instructor notification sent successfully:', data)
    return { success: true, data }

  } catch (error) {
    console.error('Error sending instructor notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getNotificationRecipients(legalArea: string) {
  try {
    // First, try to get active instructors for this legal area (supporting both legacy and new format)
    const { data: activeInstructors, error: instructorError } = await supabaseAdmin
      .from('users')
      .select('email, first_name, last_name, role, instructor_legal_area, legal_areas')
      .eq('role', 'instructor')
      .eq('email_notifications_enabled', true)
      .or(`instructor_legal_area.eq.${legalArea},legal_areas.cs.{${legalArea}}`)

    if (instructorError) {
      console.error('Error fetching instructors:', instructorError)
    }

    let recipients = activeInstructors || []

    // If no active instructors, get springer for this legal area (supporting both legacy and new format)
    if (recipients.length === 0) {
      const { data: springerUsers, error: springerError } = await supabaseAdmin
        .from('users')
        .select('email, first_name, last_name, role, instructor_legal_area, legal_areas')
        .eq('role', 'springer')
        .eq('email_notifications_enabled', true)
        .or(`instructor_legal_area.eq.${legalArea},legal_areas.cs.{${legalArea}}`)

      if (springerError) {
        console.error('Error fetching springer:', springerError)
      } else {
        recipients = springerUsers || []
      }
    }

    return {
      success: true,
      recipients,
      fallbackToSpringer: activeInstructors?.length === 0 && recipients.length > 0
    }

  } catch (error) {
    console.error('Error getting notification recipients:', error)
    return {
      success: false,
      recipients: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function testNotificationSystem() {
  try {
    console.log('Testing notification system...')

    // Get all legal areas with their notification recipients
    const legalAreas = ['Zivilrecht', 'Strafrecht', 'Öffentliches Recht']
    
    for (const area of legalAreas) {
      const result = await getNotificationRecipients(area)
      console.log(`${area}:`, {
        recipients: result.recipients?.length || 0,
        fallbackToSpringer: result.fallbackToSpringer,
        details: result.recipients?.map(r => ({ email: r.email, role: r.role }))
      })
    }

    return { success: true }

  } catch (error) {
    console.error('Error testing notification system:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
