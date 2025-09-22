// Type definitions for Supabase Edge Functions

export interface NotificationPayload {
  type: string
  record: {
    id: string
    user_id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    related_case_study_id?: string
    created_at: string
  }
}

export interface CaseStudyDetails {
  legal_area: string
  sub_area: string
  status?: string
  users?: {
    full_name: string
    email?: string
  }
}

export interface User {
  id: string
  email: string
  full_name: string
  role: string
}

// Deno runtime declarations
declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined
    }
    const env: Env
  }
}
