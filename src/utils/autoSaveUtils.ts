// Auto-Save Utilities mit PostgreSQL-Bypass
import { supabase } from '../lib/supabase';

export interface GradeData {
  grade?: number | null;
  gradeText?: string;
}

export interface SaveStatus {
  [key: string]: 'saving' | 'success' | 'error' | null;
}

// Erweiterte Notenbeschreibung
export const getGradeDescription = (points: number | null | undefined): string => {
  if (points === null || points === undefined || isNaN(points)) return '';
  if (points < 0 || points > 18) return '';
  
  if (points === 0) return 'ungenügend (0 Punkte)';
  if (points > 0 && points <= 1.49) return 'ungenügend';
  if (points >= 1.5 && points <= 3.99) return 'mangelhaft';
  if (points >= 4 && points <= 6.49) return 'ausreichend';
  if (points >= 6.5 && points <= 8.99) return 'befriedigend';
  if (points >= 9 && points <= 11.49) return 'vollbefriedigend';
  if (points >= 11.5 && points <= 13.99) return 'gut';
  if (points >= 14 && points <= 18) return 'sehr gut';
  return '';
};

// Validierung für Noteneingaben
export const isValidGrade = (grade: number | null): boolean => {
  return grade === null || (grade >= 0 && grade <= 18);
};

// PostgreSQL-basierte Grade-Update Funktion
export const updateGradePostgreSQL = async (
  caseStudyId: string, 
  grade: number | null, 
  gradeText?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🐘 PostgreSQL Grade Update:', { caseStudyId, grade, gradeText });
    
    // Verwende PostgreSQL UPSERT über Supabase RPC
    const { data, error } = await supabase.rpc('upsert_grade', {
      p_case_study_request_id: caseStudyId,
      p_grade: grade,
      p_grade_text: gradeText || null
    });
    
    if (error) {
      console.error('❌ PostgreSQL RPC error:', error);
      
      // Fallback: Direkte Supabase-Operationen
      return await updateGradeFallback(caseStudyId, grade, gradeText);
    }
    
    console.log('✅ PostgreSQL grade update successful:', data);
    return { success: true };
    
  } catch (err) {
    console.error('❌ PostgreSQL update error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Fallback-Methode für Grade-Updates
const updateGradeFallback = async (
  caseStudyId: string, 
  grade: number | null, 
  gradeText?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Using fallback grade update method...');
    
    // Prüfe ob Submission existiert
    const { data: existingSubmission, error: fetchError } = await supabase
      .from('submissions')
      .select('id')
      .eq('case_study_request_id', caseStudyId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingSubmission) {
      // Update existing submission
      const { error } = await supabase
        .from('submissions')
        .update({ 
          grade: grade,
          grade_text: gradeText || null,
          updated_at: new Date().toISOString()
        } as any) // Type assertion to bypass TypeScript issues
        .eq('case_study_request_id', caseStudyId);

      if (error) throw error;
    } else {
      // Create new submission entry
      const { error } = await supabase
        .from('submissions')
        .insert({
          case_study_request_id: caseStudyId,
          file_url: 'auto-save-placeholder',
          file_type: 'pdf',
          status: 'corrected',
          grade: grade,
          grade_text: gradeText || null,
          corrected_at: new Date().toISOString(),
          submitted_at: new Date().toISOString()
        } as any); // Type assertion to bypass TypeScript issues

      if (error) throw error;
    }

    console.log('✅ Fallback grade update successful');
    return { success: true };
    
  } catch (err) {
    console.error('❌ Fallback update error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Auto-Save Hook für React-Komponenten
export const useAutoSaveGrade = () => {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>({});
  
  const saveGrade = async (caseStudyId: string, grade: number | null, gradeText?: string) => {
    setSaveStatus(prev => ({ ...prev, [caseStudyId]: 'saving' }));
    
    try {
      const result = await updateGradePostgreSQL(caseStudyId, grade, gradeText);
      
      if (result.success) {
        setSaveStatus(prev => ({ ...prev, [caseStudyId]: 'success' }));
        
        // Clear success status after 3 seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [caseStudyId]: null }));
        }, 3000);
      } else {
        setSaveStatus(prev => ({ ...prev, [caseStudyId]: 'error' }));
        
        // Clear error status after 5 seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [caseStudyId]: null }));
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Auto-save error:', error);
      setSaveStatus(prev => ({ ...prev, [caseStudyId]: 'error' }));
      
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [caseStudyId]: null }));
      }, 5000);
    }
  };
  
  return { saveGrade, saveStatus };
};

// Extension-resistente Event-Handler
export const createExtensionResistantHandler = (
  callback: () => void,
  delay: number = 100
) => {
  return (...args: any[]) => {
    try {
      // Verzögerung um Extension-Interferenz zu vermeiden
      setTimeout(() => {
        try {
          callback();
        } catch (error) {
          // Ignoriere Extension-Fehler
          if (error instanceof Error && !error.message.includes('Extension context')) {
            console.error('Handler error:', error);
          }
        }
      }, delay);
    } catch (error) {
      // Ignoriere Extension-Fehler
      if (error instanceof Error && !error.message.includes('Extension context')) {
        console.error('Handler setup error:', error);
      }
    }
  };
};

// Visual Feedback Utilities
export const applyVisualFeedback = (
  element: HTMLElement,
  type: 'success' | 'error' | 'saving' | 'null',
  duration: number = 3000
) => {
  const styles = {
    success: {
      border: '3px solid #10b981',
      backgroundColor: '#f0fdf4',
      boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
    },
    error: {
      border: '3px solid #ef4444',
      backgroundColor: '#fef2f2',
      boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
    },
    saving: {
      border: '3px solid #3b82f6',
      backgroundColor: '#eff6ff',
      boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
    },
    null: {
      border: '3px solid #8b5cf6',
      backgroundColor: '#f3f4f6',
      boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
    }
  };
  
  const style = styles[type];
  Object.assign(element.style, style);
  
  setTimeout(() => {
    element.style.border = '';
    element.style.backgroundColor = '';
    element.style.boxShadow = '';
  }, duration);
};

// Import React für Hook
import React from 'react';
