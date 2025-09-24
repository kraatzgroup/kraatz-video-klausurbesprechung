// Auto-Save Grade Input Komponente
// Ausschließlich Auto-Save, kein Button
// Unterstützt Werte und NULL

import React, { useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, Trash2 } from 'lucide-react';
import { 
  useGradeAutoSave, 
  applyAutoSaveVisualFeedback,
  createAutoSaveEventHandlers 
} from '../utils/gradeAutoSave';

interface GradeAutoSaveInputProps {
  caseStudyId: string;
  initialGrade?: number | null;
  initialGradeText?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showDescription?: boolean;
  onSave?: (grade: number | null, gradeText: string) => void;
}

const GradeAutoSaveInput: React.FC<GradeAutoSaveInputProps> = ({
  caseStudyId,
  initialGrade = null,
  initialGradeText = '',
  placeholder = "Note (0-18) - Leer = NULL",
  disabled = false,
  className = '',
  showDescription = true,
  onSave
}) => {
  const gradeInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    currentGrade,
    currentGradeText,
    status,
    handleInputChange,
    handleTextChange,
    triggerAutoSave
  } = useGradeAutoSave(caseStudyId);

  // Initialisierung mit Anfangswerten
  useEffect(() => {
    if (initialGrade !== null || initialGradeText) {
      triggerAutoSave(initialGrade, initialGradeText);
    }
  }, [initialGrade, initialGradeText, triggerAutoSave]);

  // Callback für Parent-Komponente
  useEffect(() => {
    if (onSave && (status === 'success')) {
      onSave(currentGrade, currentGradeText);
    }
  }, [currentGrade, currentGradeText, status, onSave]);

  // Event-Handler Setup
  useEffect(() => {
    const gradeInput = gradeInputRef.current;
    const textInput = textInputRef.current;
    
    if (!gradeInput || !textInput) return;

    const { handleGradeInput, handleTextInput } = createAutoSaveEventHandlers(
      caseStudyId,
      (grade) => {
        handleInputChange(grade?.toString() || '');
        
        // Visual Feedback
        applyAutoSaveVisualFeedback(
          gradeInput,
          grade === null ? 'null' : (status === 'success' ? 'success' : 'saving'),
          2000
        );
      },
      (text) => {
        handleTextChange(text);
      }
    );

    // Auto-Save Events
    const events = ['blur', 'focusout', 'change'];
    
    events.forEach(eventType => {
      gradeInput.addEventListener(eventType, handleGradeInput, { passive: true });
    });

    textInput.addEventListener('blur', handleTextInput, { passive: true });
    textInput.addEventListener('focusout', handleTextInput, { passive: true });

    // Keyboard Events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        setTimeout(() => {
          handleGradeInput(e);
        }, 100);
      }
      if (e.key === 'Escape') {
        gradeInput.value = '';
        setTimeout(() => {
          handleGradeInput(e);
        }, 100);
      }
    };

    gradeInput.addEventListener('keydown', handleKeyDown, { passive: true });

    // Cleanup
    return () => {
      events.forEach(eventType => {
        gradeInput.removeEventListener(eventType, handleGradeInput);
      });
      textInput.removeEventListener('blur', handleTextInput);
      textInput.removeEventListener('focusout', handleTextInput);
      gradeInput.removeEventListener('keydown', handleKeyDown);
    };
  }, [caseStudyId, handleInputChange, handleTextChange, status]);

  // Status-abhängige Styles
  const getInputStyles = () => {
    const baseStyles = `
      w-full px-3 py-2 text-sm border rounded-md
      focus:ring-2 focus:ring-blue-500 focus:border-transparent 
      transition-all duration-300 ease-in-out
      placeholder-gray-400
    `;
    
    if (disabled) {
      return `${baseStyles} bg-gray-100 border-gray-300 cursor-not-allowed`;
    }
    
    switch (status) {
      case 'saving':
        return `${baseStyles} border-blue-400 bg-blue-50 shadow-md`;
      case 'success':
        return `${baseStyles} border-green-400 bg-green-50 shadow-md`;
      case 'error':
        return `${baseStyles} border-red-400 bg-red-50 shadow-md`;
      default:
        if (currentGrade === null) {
          return `${baseStyles} border-purple-300 bg-purple-50`;
        }
        return `${baseStyles} border-gray-300 bg-white hover:border-gray-400`;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        if (currentGrade === null) {
          return <Trash2 className="w-4 h-4 text-purple-500" />;
        }
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'saving':
        return 'Speichert automatisch...';
      case 'success':
        return currentGrade === null ? 'NULL-Wert gespeichert' : `Note ${currentGrade} gespeichert`;
      case 'error':
        return 'Fehler beim Speichern';
      default:
        return 'Auto-Save aktiv';
    }
  };

  const isValidGrade = (grade: number | null): boolean => {
    return grade === null || (grade >= 0 && grade <= 18);
  };

  return (
    <div className={`grade-auto-save-input ${className}`}>
      <div className="space-y-3">
        {/* Header mit Status */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Noteneingabe (Auto-Save)
          </label>
          <div className="flex items-center gap-2 text-xs">
            {getStatusIcon()}
            <span className={`
              ${status === 'saving' ? 'text-blue-600' : ''}
              ${status === 'success' ? 'text-green-600' : ''}
              ${status === 'error' ? 'text-red-600' : ''}
              ${status === 'idle' ? 'text-gray-500' : ''}
            `}>
              {getStatusMessage()}
            </span>
          </div>
        </div>

        {/* Grade Input */}
        <div className="relative">
          <input
            ref={gradeInputRef}
            type="number"
            min="0"
            max="18"
            step="0.5"
            placeholder={placeholder}
            defaultValue={initialGrade !== null ? initialGrade : ''}
            disabled={disabled}
            className={getInputStyles()}
            
            // Autofill-Prävention
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            data-chrome-autofill="disabled"
          />
          
          {/* Validierungs-Icon */}
          {currentGrade !== null && !isValidGrade(currentGrade) && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </div>
          )}
        </div>

        {/* Grade Description Textarea */}
        {showDescription && (
          <textarea
            ref={textInputRef}
            placeholder={
              currentGrade === null 
                ? "Notenbeschreibung (Note eingeben für automatische Beschreibung)"
                : "Notenbeschreibung (automatisch generiert, editierbar)"
            }
            defaultValue={initialGradeText}
            disabled={disabled}
            rows={2}
            className={`
              w-full px-3 py-2 text-sm border border-gray-300 rounded-md
              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
              resize-none transition-colors duration-200
              placeholder-gray-400
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
            `}
            
            // Autofill-Prävention
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
          />
        )}

        {/* Validierungshinweise */}
        {currentGrade !== null && !isValidGrade(currentGrade) && (
          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>Ungültige Note (0-18 erlaubt) - wird trotzdem gespeichert</span>
          </div>
        )}

        {/* NULL-Hinweis */}
        {currentGrade === null && (
          <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
            <Trash2 className="w-3 h-3" />
            <span>NULL-Wert - Feld ist leer und wird als "keine Note" gespeichert</span>
          </div>
        )}

        {/* Aktuelle Werte Anzeige */}
        {(currentGrade !== null || currentGradeText) && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
            <div className="font-medium text-gray-700 mb-1">Aktuelle Werte:</div>
            <div className="text-gray-600">
              <div><strong>Note:</strong> {currentGrade !== null ? `${currentGrade} Punkte` : 'NULL'}</div>
              {currentGradeText && (
                <div><strong>Beschreibung:</strong> {currentGradeText}</div>
              )}
            </div>
          </div>
        )}

        {/* Debug-Info (nur in Development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-gray-100 border rounded text-xs text-gray-600">
            <div><strong>Debug:</strong></div>
            <div>Case ID: {caseStudyId}</div>
            <div>Status: {status}</div>
            <div>Grade: {currentGrade === null ? 'NULL' : currentGrade}</div>
            <div>Valid: {isValidGrade(currentGrade) ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeAutoSaveInput;
