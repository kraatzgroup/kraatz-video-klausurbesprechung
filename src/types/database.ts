// Vollständige Database-Typen für TypeScript
// Löst alle "never" Type-Probleme

// Type for individual additional material objects
export interface AdditionalMaterial {
  id: string
  filename: string
  url: string
  uploaded_at: string
  size: number | null
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          role: 'student' | 'instructor' | 'admin' | 'springer'
          account_credits: number
          instructor_legal_area: string | null
          email_notifications_enabled: boolean
          profile_image_url: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          role?: 'student' | 'instructor' | 'admin' | 'springer'
          account_credits?: number
          instructor_legal_area?: string | null
          email_notifications_enabled?: boolean
          profile_image_url?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          role?: 'student' | 'instructor' | 'admin' | 'springer'
          account_credits?: number
          instructor_legal_area?: string | null
          email_notifications_enabled?: boolean
          profile_image_url?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      case_study_requests: {
        Row: {
          id: string
          user_id: string
          case_study_number: number | null
          study_phase: string
          legal_area: string
          sub_area: string | null
          focus_area: string
          status: 'requested' | 'materials_ready' | 'submitted' | 'under_review' | 'corrected' | 'completed'
          pdf_url: string | null
          case_study_material_url: string | null
          additional_materials_url: string | null
          additional_materials: AdditionalMaterial[]
          submission_url: string | null
          submission_downloaded_at: string | null
          video_correction_url: string | null
          written_correction_url: string | null
          video_viewed_at: string | null
          pdf_downloaded_at: string | null
          correction_viewed_at: string | null
          solution_pdf_url: string | null
          instructor_id: string | null
          assigned_instructor_id: string | null
          previous_instructor_id: string | null
          assignment_date: string | null
          assignment_reason: string | null
          federal_state: string | null
          scoring_sheet_url: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          case_study_number?: number | null
          study_phase: string
          legal_area: string
          sub_area?: string | null
          focus_area: string
          status?: 'requested' | 'materials_ready' | 'submitted' | 'under_review' | 'corrected' | 'completed'
          pdf_url?: string | null
          case_study_material_url?: string | null
          additional_materials_url?: string | null
          additional_materials?: AdditionalMaterial[]
          submission_url?: string | null
          submission_downloaded_at?: string | null
          video_correction_url?: string | null
          written_correction_url?: string | null
          video_viewed_at?: string | null
          pdf_downloaded_at?: string | null
          correction_viewed_at?: string | null
          solution_pdf_url?: string | null
          instructor_id?: string | null
          assigned_instructor_id?: string | null
          previous_instructor_id?: string | null
          assignment_date?: string | null
          assignment_reason?: string | null
          federal_state?: string | null
          scoring_sheet_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          case_study_number?: number | null
          study_phase?: string
          legal_area?: string
          sub_area?: string | null
          focus_area?: string
          status?: 'requested' | 'materials_ready' | 'submitted' | 'under_review' | 'corrected' | 'completed'
          pdf_url?: string | null
          case_study_material_url?: string | null
          additional_materials_url?: string | null
          additional_materials?: AdditionalMaterial[]
          submission_url?: string | null
          submission_downloaded_at?: string | null
          video_correction_url?: string | null
          written_correction_url?: string | null
          video_viewed_at?: string | null
          pdf_downloaded_at?: string | null
          correction_viewed_at?: string | null
          solution_pdf_url?: string | null
          instructor_id?: string | null
          assigned_instructor_id?: string | null
          previous_instructor_id?: string | null
          assignment_date?: string | null
          assignment_reason?: string | null
          federal_state?: string | null
          scoring_sheet_url?: string | null
          created_at?: string
          updated_at?: string | null
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
          grade: number | null
          grade_text: string | null
          is_deleted: boolean | null
          created_at: string
          updated_at: string | null
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
          grade?: number | null
          grade_text?: string | null
          is_deleted?: boolean | null
          created_at?: string
          updated_at?: string | null
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
          grade?: number | null
          grade_text?: string | null
          is_deleted?: boolean | null
          created_at?: string
          updated_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          read: boolean
          related_case_study_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          related_case_study_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          read?: boolean
          related_case_study_id?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          title: string | null
          type: 'direct' | 'group' | 'support'
          created_by: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          type: 'direct' | 'group' | 'support'
          created_by: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          type?: 'direct' | 'group' | 'support'
          created_by?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
          last_read_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
          last_read_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
          last_read_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'system' | 'file'
          is_deleted: boolean
          edited_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'system' | 'file'
          is_deleted?: boolean
          edited_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'system' | 'file'
          is_deleted?: boolean
          edited_at?: string | null
          created_at?: string
        }
      }
      video_lessons: {
        Row: {
          id: string
          title: string
          description: string | null
          video_url: string
          duration: number
          category: string
          thumbnail_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          video_url: string
          duration: number
          category: string
          thumbnail_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          video_url?: string
          duration?: number
          category?: string
          thumbnail_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      video_progress: {
        Row: {
          id: string
          user_id: string
          video_lesson_id: string
          watched: boolean
          watch_time: number
          completed_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          video_lesson_id: string
          watched?: boolean
          watch_time?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          video_lesson_id?: string
          watched?: boolean
          watch_time?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      case_study_ratings: {
        Row: {
          id: string
          case_study_id: string
          user_id: string
          rating: number
          feedback: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          case_study_id: string
          user_id: string
          rating: number
          feedback?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          case_study_id?: string
          user_id?: string
          rating?: number
          feedback?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      packages: {
        Row: {
          id: string
          package_key: string
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
          package_key: string
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
          package_key?: string
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
    }
    Functions: {
      upsert_grade: {
        Args: {
          p_case_study_request_id: string
          p_grade: number | null
          p_grade_text: string | null
        }
        Returns: any
      }
      admin_delete_case_study: {
        Args: {
          case_id: string
        }
        Returns: {
          success: boolean
          deleted_submissions: number
          deleted_ratings: number
          deleted_notifications: number
          message?: string
          error?: string
          error_code?: string
        }
      }
    }
  }
}
