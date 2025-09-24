// Patch für InstructorDashboard.tsx - Ermöglicht 0 als Note und Entfernen von Noten
// Diese Datei zeigt die notwendigen Änderungen - nicht direkt ausführbar

import { supabase } from '../lib/supabase';

// Typen für bessere TypeScript-Unterstützung
interface GradeData {
  grade?: number;
  gradeText?: string;
}

interface SaveStatus {
  [key: string]: 'saving' | 'success' | 'error' | null;
}

// 1. Erweitere die getGradeDescription Funktion um 0 Punkte:
const getGradeDescription = (points: number): string => {
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

// 2. Neue Funktion zum Entfernen von Noten:
// Diese Funktion muss in der InstructorDashboard Komponente implementiert werden
const createRemoveGradeFunction = (
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

// 3. Aktualisierte Validierung für 0 als gültige Note:
// Ersetze alle Vorkommen von:
// disabled={!grades[request.id]?.grade || grades[request.id]?.grade < 0 || grades[request.id]?.grade > 18}
// Mit:
// disabled={grades[request.id]?.grade === undefined || grades[request.id]?.grade === null || grades[request.id]?.grade < 0 || grades[request.id]?.grade > 18}

// 4. Aktualisierte onChange Handler:
// Diese Funktion zeigt das Pattern - muss in der Komponente implementiert werden
const createHandleGradeChange = (
  setGrades: React.Dispatch<React.SetStateAction<{[key: string]: GradeData}>>
) => {
  return (requestId: string, value: string) => {
    const grade = value === '' ? undefined : parseFloat(value);
    const gradeDescription = (grade !== undefined && grade >= 0) ? getGradeDescription(grade) : '';
    
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

// 5. Aktualisierte Validierung in updateGrade:
// Diese Funktion zeigt das Pattern - muss in der Komponente implementiert werden
const createUpdateGrade = (
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
      // ... Rest der Funktion bleibt gleich
      // Implementierung siehe GRADE_INPUT_INSTRUCTIONS.md
    } catch (error) {
      // ... Error handling
    }
  };
};

// Export der Factory-Funktionen für bessere TypeScript-Unterstützung
export {
  getGradeDescription,
  createRemoveGradeFunction,
  createHandleGradeChange,
  createUpdateGrade,
  type GradeData,
  type SaveStatus
};
