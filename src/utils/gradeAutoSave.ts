// Komplette Auto-Save Lösung für Notenvergabe
// Ausschließlich Auto-Save, kein Button
// Unterstützt Werte und NULL
// Verwendet PostgreSQL direkt wie bevorzugt

import { supabase } from '../lib/supabase';

export interface GradeAutoSaveConfig {
  caseStudyId: string;
  onSaveStart?: () => void;
  onSaveSuccess?: (grade: number | null, gradeText: string | null) => void;
  onSaveError?: (error: string) => void;
  debounceMs?: number;
}

export interface GradeData {
  grade: number | null;
  gradeText: string | null;
}

// Debounce-Map für Auto-Save
const saveTimeouts = new Map<string, NodeJS.Timeout>();

// Status-Tracking
const saveStatus = new Map<string, 'idle' | 'saving' | 'success' | 'error'>();

// Notenbeschreibung generieren
export const generateGradeDescription = (points: number | null): string => {
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

// PostgreSQL-basierte Speicherfunktion
export const saveGradeToPostgreSQL = async (
  caseStudyId: string, 
  grade: number | null, 
  gradeText: string | null
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    console.log('🐘 PostgreSQL Auto-Save:', { caseStudyId, grade, gradeText });
    
    // Verwende PostgreSQL RPC-Funktion
    const { data, error } = await supabase.rpc('upsert_grade', {
      p_case_study_request_id: caseStudyId,
      p_grade: grade,
      p_grade_text: gradeText
    });
    
    if (error) {
      console.error('❌ PostgreSQL RPC error:', error);
      
      // Fallback: Direkte Supabase-Operationen mit Type-Assertion
      return await fallbackSaveGrade(caseStudyId, grade, gradeText);
    }
    
    console.log('✅ PostgreSQL auto-save successful:', data);
    return { success: true, data };
    
  } catch (err) {
    console.error('❌ PostgreSQL save error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Fallback-Speicherfunktion
const fallbackSaveGrade = async (
  caseStudyId: string, 
  grade: number | null, 
  gradeText: string | null
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    console.log('🔄 Using fallback save method...');
    
    // Prüfe ob Submission existiert
    const { data: existingSubmission, error: fetchError } = await supabase
      .from('submissions')
      .select('id')
      .eq('case_study_request_id', caseStudyId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingSubmission) {
      // Update existing submission mit Type-Assertion
      const { error } = await supabase
        .from('submissions')
        .update({ 
          grade: grade,
          grade_text: gradeText,
          updated_at: new Date().toISOString()
        } as any)
        .eq('case_study_request_id', caseStudyId);

      if (error) throw error;
      console.log('✅ Fallback update successful');
    } else {
      // Create new submission mit Type-Assertion
      const { error } = await supabase
        .from('submissions')
        .insert({
          case_study_request_id: caseStudyId,
          file_url: 'auto-save-grade',
          file_type: 'pdf',
          status: 'corrected',
          grade: grade,
          grade_text: gradeText,
          corrected_at: new Date().toISOString(),
          submitted_at: new Date().toISOString()
        } as any);

      if (error) throw error;
      console.log('✅ Fallback insert successful');
    }

    return { success: true };
    
  } catch (err) {
    console.error('❌ Fallback save error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Hauptfunktion für Auto-Save
export const performAutoSave = async (
  caseStudyId: string,
  grade: number | null,
  gradeText: string | null,
  config: Partial<GradeAutoSaveConfig> = {}
): Promise<void> => {
  const {
    onSaveStart,
    onSaveSuccess,
    onSaveError,
    debounceMs = 500
  } = config;

  // Debounce: Lösche vorherigen Timer
  const existingTimeout = saveTimeouts.get(caseStudyId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Setze neuen Timer
  const timeout = setTimeout(async () => {
    try {
      // Status: Saving
      saveStatus.set(caseStudyId, 'saving');
      onSaveStart?.();

      console.log(`🔄 Auto-Save triggered for ${caseStudyId}:`, {
        grade: grade === null ? 'NULL' : grade,
        gradeText: gradeText || '(empty)'
      });

      // Speichere in PostgreSQL
      const result = await saveGradeToPostgreSQL(caseStudyId, grade, gradeText);

      if (result.success) {
        saveStatus.set(caseStudyId, 'success');
        onSaveSuccess?.(grade, gradeText);
        
        console.log(`✅ Auto-Save successful for ${caseStudyId}`);
        
        // Erfolgs-Status nach 3 Sekunden zurücksetzen
        setTimeout(() => {
          if (saveStatus.get(caseStudyId) === 'success') {
            saveStatus.set(caseStudyId, 'idle');
          }
        }, 3000);
      } else {
        saveStatus.set(caseStudyId, 'error');
        onSaveError?.(result.error || 'Unknown error');
        
        console.error(`❌ Auto-Save failed for ${caseStudyId}:`, result.error);
        
        // Fehler-Status nach 5 Sekunden zurücksetzen
        setTimeout(() => {
          if (saveStatus.get(caseStudyId) === 'error') {
            saveStatus.set(caseStudyId, 'idle');
          }
        }, 5000);
      }

    } catch (error) {
      saveStatus.set(caseStudyId, 'error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onSaveError?.(errorMessage);
      
      console.error(`❌ Auto-Save exception for ${caseStudyId}:`, error);
    } finally {
      saveTimeouts.delete(caseStudyId);
    }
  }, debounceMs);

  saveTimeouts.set(caseStudyId, timeout);
};

// Status-Abfrage
export const getAutoSaveStatus = (caseStudyId: string): 'idle' | 'saving' | 'success' | 'error' => {
  return saveStatus.get(caseStudyId) || 'idle';
};

// Visual Feedback für Input-Elemente
export const applyAutoSaveVisualFeedback = (
  element: HTMLElement,
  status: 'idle' | 'saving' | 'success' | 'error' | 'null',
  duration: number = 3000
): void => {
  const styles = {
    idle: {
      border: '',
      backgroundColor: '',
      boxShadow: ''
    },
    saving: {
      border: '3px solid #3b82f6',
      backgroundColor: '#eff6ff',
      boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
    },
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
    null: {
      border: '3px solid #8b5cf6',
      backgroundColor: '#f3f4f6',
      boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
    }
  };

  const style = styles[status];
  Object.assign(element.style, style);
  element.style.transition = 'all 0.3s ease';

  if (status !== 'idle' && duration > 0) {
    setTimeout(() => {
      Object.assign(element.style, styles.idle);
    }, duration);
  }
};

// Hook für React-Komponenten
export const useGradeAutoSave = (caseStudyId: string) => {
  const [currentGrade, setCurrentGrade] = React.useState<number | null>(null);
  const [currentGradeText, setCurrentGradeText] = React.useState<string>('');
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const triggerAutoSave = React.useCallback((grade: number | null, gradeText?: string) => {
    // Automatische Beschreibung für gültige Noten
    let finalGradeText = gradeText;
    if (grade !== null && !gradeText) {
      finalGradeText = generateGradeDescription(grade);
    }

    setCurrentGrade(grade);
    setCurrentGradeText(finalGradeText || '');

    performAutoSave(caseStudyId, grade, finalGradeText || null, {
      onSaveStart: () => setStatus('saving'),
      onSaveSuccess: () => setStatus('success'),
      onSaveError: () => setStatus('error')
    });
  }, [caseStudyId]);

  const handleInputChange = React.useCallback((value: string) => {
    const trimmedValue = value.trim();
    
    if (trimmedValue === '') {
      // NULL-Wert
      triggerAutoSave(null, '');
    } else {
      const parsedGrade = parseFloat(trimmedValue);
      if (!isNaN(parsedGrade)) {
        triggerAutoSave(parsedGrade);
      }
    }
  }, [triggerAutoSave]);

  const handleTextChange = React.useCallback((gradeText: string) => {
    setCurrentGradeText(gradeText);
    triggerAutoSave(currentGrade, gradeText);
  }, [currentGrade, triggerAutoSave]);

  return {
    currentGrade,
    currentGradeText,
    status,
    handleInputChange,
    handleTextChange,
    triggerAutoSave
  };
};

// Extension-resistente Event-Handler
export const createAutoSaveEventHandlers = (
  caseStudyId: string,
  onGradeChange: (grade: number | null) => void,
  onTextChange: (text: string) => void
) => {
  const handleGradeInput = (event: Event) => {
    try {
      const target = event.target as HTMLInputElement;
      const value = target.value.trim();
      
      if (value === '') {
        onGradeChange(null);
      } else {
        const grade = parseFloat(value);
        if (!isNaN(grade)) {
          onGradeChange(grade);
        }
      }
    } catch (error) {
      // Ignoriere Extension-Fehler
      if (!(error instanceof Error && error.message.includes('Extension context'))) {
        console.error('Grade input error:', error);
      }
    }
  };

  const handleTextInput = (event: Event) => {
    try {
      const target = event.target as HTMLTextAreaElement;
      onTextChange(target.value);
    } catch (error) {
      // Ignoriere Extension-Fehler
      if (!(error instanceof Error && error.message.includes('Extension context'))) {
        console.error('Text input error:', error);
      }
    }
  };

  return {
    handleGradeInput,
    handleTextInput
  };
};

// Import React für Hook
import React from 'react';
