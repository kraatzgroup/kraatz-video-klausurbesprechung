import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          account_credits: number
          role: 'student' | 'instructor' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          account_credits?: number
          role?: 'student' | 'instructor' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          account_credits?: number
          role?: 'student' | 'instructor' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          name: string
          description: string
          case_study_count: number
          price_cents: number
          stripe_price_id: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          case_study_count: number
          price_cents: number
          stripe_price_id: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          case_study_count?: number
          price_cents?: number
          stripe_price_id?: string
          active?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          package_id: string
          stripe_payment_intent_id: string
          status: 'pending' | 'completed' | 'failed'
          total_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          package_id: string
          stripe_payment_intent_id: string
          status?: 'pending' | 'completed' | 'failed'
          total_cents: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          package_id?: string
          stripe_payment_intent_id?: string
          status?: 'pending' | 'completed' | 'failed'
          total_cents?: number
          created_at?: string
        }
      }
      case_study_requests: {
        Row: {
          id: string
          user_id: string
          legal_area: string
          sub_area: string
          focus_area: string
          status: 'requested' | 'materials_ready' | 'submitted' | 'corrected'
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          legal_area: string
          sub_area: string
          focus_area: string
          status?: 'requested' | 'materials_ready' | 'submitted' | 'corrected'
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          legal_area?: string
          sub_area?: string
          focus_area?: string
          status?: 'requested' | 'materials_ready' | 'submitted' | 'corrected'
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          case_study_request_id: string
          file_url: string
          file_type: 'pdf' | 'docx'
          status: 'submitted' | 'under_review' | 'corrected'
          correction_video_url: string | null
          landing_page_url: string | null
          submitted_at: string
          corrected_at: string | null
        }
        Insert: {
          id?: string
          case_study_request_id: string
          file_url: string
          file_type: 'pdf' | 'docx'
          status?: 'submitted' | 'under_review' | 'corrected'
          correction_video_url?: string | null
          landing_page_url?: string | null
          submitted_at?: string
          corrected_at?: string | null
        }
        Update: {
          id?: string
          case_study_request_id?: string
          file_url?: string
          file_type?: 'pdf' | 'docx'
          status?: 'submitted' | 'under_review' | 'corrected'
          correction_video_url?: string | null
          landing_page_url?: string | null
          submitted_at?: string
          corrected_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning'
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning'
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning'
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}
