import React from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

// Typen für bessere TypeScript-Unterstützung
export interface GradeData {
  grade?: number | null;
  gradeText?: string;
}

export interface SaveStatus {
  [key: string]: 'saving' | 'success' | 'error' | null;
}

// Type für Submission-Updates
type SubmissionUpdate = Database['public']['Tables']['submissions']['Update'];
type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];

// Erweiterte Notenbeschreibung (inkl. 0 Punkte und NULL)
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

// Factory-Funktion für removeGrade
export const createRemoveGradeFunction = (
  setGrades: React.Dispatch<React.SetStateAction<{[key: string]: GradeData}>>,
  fetchData: () => void
) => {
  return async (caseStudyId: string) => {
    try {
      // Entferne Note aus der Datenbank
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('case_study_request_id', caseStudyId);

      if (error) throw error;

      // Entferne Note aus dem lokalen State
      setGrades((prev: {[key: string]: GradeData}) => {
        const newGrades = { ...prev };
        delete newGrades[caseStudyId];
        return newGrades;
      });

      // Refresh data
      fetchData();
      
      // Toast-Nachricht
      alert('Note erfolgreich entfernt!');
    } catch (error) {
      console.error('Error removing grade:', error);
      alert('Fehler beim Entfernen der Note');
    }
  };
};

// Factory-Funktion für handleGradeChange (mit NULL-Unterstützung und Beschreibung-Clearing)
export const createHandleGradeChange = (
  setGrades: React.Dispatch<React.SetStateAction<{[key: string]: GradeData}>>
) => {
  return (requestId: string, value: string) => {
    const trimmedValue = value.trim();
    
    let grade: number | null = null;
    let gradeDescription = '';
    
    if (trimmedValue === '') {
      // Leeres Feld - alles auf null/leer setzen
      grade = null;
      gradeDescription = '';
    } else {
      // Versuche zu parsen
      const parsedGrade = parseFloat(trimmedValue);
      
      if (isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 18) {
        // Ungültige Eingabe - Grade setzen aber Beschreibung leer lassen
        grade = parsedGrade;
        gradeDescription = '';
      } else {
        // Gültige Note - Beschreibung generieren
        grade = parsedGrade;
        gradeDescription = getGradeDescription(parsedGrade);
      }
    }
    
    setGrades((prev: {[key: string]: GradeData}) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        grade: grade,
        gradeText: gradeDescription
      }
    }));
  };
};

// Factory-Funktion für updateGrade
export const createUpdateGrade = (
  saveStatus: SaveStatus,
  setSaveStatus: React.Dispatch<React.SetStateAction<SaveStatus>>,
  fetchData: () => void
) => {
  return async (caseStudyId: string, grade: number, gradeText?: string) => {
    // Verhindere mehrfache gleichzeitige Speichervorgänge
    if (saveStatus[caseStudyId] === 'saving') {
      return;
    }

    // Validierung: 0 ist jetzt erlaubt
    if (grade < 0 || grade > 18) {
      alert('Bitte geben Sie eine gültige Note zwischen 0 und 18 ein.');
      return;
    }

    setSaveStatus((prev: SaveStatus) => ({ ...prev, [caseStudyId]: 'saving' }));
    
    try {
      // Check if submission exists
      const { data: existingSubmission, error: fetchError } = await supabase
        .from('submissions')
        .select('id')
        .eq('case_study_request_id', caseStudyId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingSubmission) {
        // Update existing submission
        const updateData: SubmissionUpdate = { 
          grade: grade,
          grade_text: gradeText || null,
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('submissions')
          .update(updateData)
          .eq('case_study_request_id', caseStudyId);

        if (error) throw error;
      } else {
        // Create new submission entry
        const insertData: SubmissionInsert = {
          case_study_request_id: caseStudyId,
          file_url: 'auto-save-placeholder',
          file_type: 'pdf',
          status: 'corrected',
          grade: grade,
          grade_text: gradeText || null,
          corrected_at: new Date().toISOString(),
          submitted_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('submissions')
          .insert(insertData);

        if (error) throw error;
      }

      // Refresh data
      fetchData();
      setSaveStatus((prev: SaveStatus) => ({ ...prev, [caseStudyId]: 'success' }));
      
      // Clear success status after 3 seconds
      setTimeout(() => {
        setSaveStatus((prev: SaveStatus) => ({ ...prev, [caseStudyId]: null }));
      }, 3000);
    } catch (error) {
      console.error('Error updating grade:', error);
      setSaveStatus((prev: SaveStatus) => ({ ...prev, [caseStudyId]: 'error' }));
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatus((prev: SaveStatus) => ({ ...prev, [caseStudyId]: null }));
      }, 5000);
    }
  };
};

// Validierungshilfe für Button-Status (NULL-Werte erlaubt)
export const isValidGrade = (grade?: number | null): boolean => {
  return grade === null || grade === undefined || (grade >= 0 && grade <= 18);
};

// Validierungshilfe für Button-Deaktivierung (nur bei ungültigen Werten)
export const shouldDisableButton = (
  grade?: number | null, 
  saveStatus?: 'saving' | 'success' | 'error' | null
): boolean => {
  // Nur deaktivieren wenn: 1) gerade speichert oder 2) ungültige Note (nicht NULL/undefined)
  return saveStatus === 'saving' || 
         (grade !== null && grade !== undefined && (grade < 0 || grade > 18));
};

// Hilfsfunktion für Button-Text
export const getButtonText = (grade?: number | null): string => {
  if (grade === null || grade === undefined) {
    return 'Note löschen';
  }
  return 'Note speichern';
};

// Hilfsfunktion für Button-Tooltip
export const getButtonTooltip = (grade?: number | null): string => {
  if (grade === null || grade === undefined) {
    return 'Leeres Feld löscht die Note aus der Datenbank';
  }
  return 'Note in der Datenbank speichern';
};

// Hilfsfunktion um zu prüfen ob Beschreibung automatisch ist
export const isAutomaticDescription = (grade?: number | null, description?: string): boolean => {
  if (!description) return true; // Leere Beschreibung ist "automatisch"
  
  const expectedDescription = getGradeDescription(grade);
  return description === expectedDescription;
};

// Hilfsfunktion für Placeholder-Text
export const getDescriptionPlaceholder = (grade?: number | null): string => {
  const autoDescription = getGradeDescription(grade);
  
  if (autoDescription) {
    return `Automatisch: "${autoDescription}" (oder eigene Beschreibung eingeben)`;
  }
  
  return 'Notenbeschreibung (optional) - Note eingeben für automatische Beschreibung';
};
