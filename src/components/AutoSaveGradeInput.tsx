import React, { useState, useEffect, useRef } from 'react';
import { Save, Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { 
  getGradeDescription, 
  isValidGrade, 
  useAutoSaveGrade, 
  createExtensionResistantHandler,
  applyVisualFeedback 
} from '../utils/autoSaveUtils';

interface AutoSaveGradeInputProps {
  caseStudyId: string;
  currentGrade?: number | null;
  currentGradeText?: string;
  onSave?: (grade: number | null, gradeText: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const AutoSaveGradeInput: React.FC<AutoSaveGradeInputProps> = ({
  caseStudyId,
  currentGrade,
  currentGradeText,
  onSave,
  disabled = false,
  placeholder = "Note (0-18) - Leer = NULL",
  className = ""
}) => {
  const [grade, setGrade] = useState<number | null>(currentGrade ?? null);
  const [gradeText, setGradeText] = useState(currentGradeText || '');
  const [randomId] = useState(() => `grade-${Math.random().toString(36).substr(2, 9)}`);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { saveGrade, saveStatus } = useAutoSaveGrade();
  const currentStatus = saveStatus[caseStudyId];

  // Sync with props
  useEffect(() => {
    setGrade(currentGrade ?? null);
    setGradeText(currentGradeText || '');
  }, [currentGrade, currentGradeText]);

  // Auto-Save Handler (Extension-resistent)
  const handleAutoSave = createExtensionResistantHandler(async () => {
    if (disabled) return;
    
    console.log('🔄 Auto-Save triggered:', { caseStudyId, grade, gradeText });
    
    try {
      await saveGrade(caseStudyId, grade, gradeText);
      
      // Visual feedback
      if (inputRef.current) {
        applyVisualFeedback(
          inputRef.current, 
          grade === null ? 'null' : 'success',
          2000
        );
      }
      
      // Callback für Parent-Komponente
      if (onSave) {
        onSave(grade, gradeText);
      }
      
    } catch (error) {
      console.error('❌ Auto-save error:', error);
      
      if (inputRef.current) {
        applyVisualFeedback(inputRef.current, 'error', 3000);
      }
    }
  }, 200);

  // Grade Change Handler
  const handleGradeChange = (value: string) => {
    const trimmedValue = value.trim();
    
    if (trimmedValue === '') {
      setGrade(null);
      setGradeText('');
    } else {
      const parsedGrade = parseFloat(trimmedValue);
      setGrade(parsedGrade);
      
      // Automatische Beschreibung nur bei gültigen Noten
      if (!isNaN(parsedGrade) && isValidGrade(parsedGrade)) {
        setGradeText(getGradeDescription(parsedGrade));
      } else {
        setGradeText('');
      }
    }
  };

  // Manual Save Handler
  const handleManualSave = () => {
    handleAutoSave();
  };

  // Status-abhängige Styles
  const getInputStyles = () => {
    const baseStyles = `
      w-full px-3 py-2 text-sm border rounded 
      focus:ring-2 focus:ring-blue-500 focus:border-transparent 
      transition-all duration-200
    `;
    
    if (currentStatus === 'saving') {
      return `${baseStyles} border-blue-300 bg-blue-50`;
    } else if (currentStatus === 'success') {
      return `${baseStyles} border-green-300 bg-green-50`;
    } else if (currentStatus === 'error') {
      return `${baseStyles} border-red-300 bg-red-50`;
    } else if (grade === null) {
      return `${baseStyles} border-purple-300 bg-purple-50`;
    } else if (!isValidGrade(grade)) {
      return `${baseStyles} border-orange-300 bg-orange-50`;
    }
    
    return `${baseStyles} border-gray-300 bg-white`;
  };

  const getButtonConfig = () => {
    if (currentStatus === 'saving') {
      return {
        text: 'Speichert...',
        icon: <Loader className="w-4 h-4 animate-spin" />,
        className: 'bg-blue-600 text-white cursor-not-allowed',
        disabled: true
      };
    } else if (currentStatus === 'success') {
      return {
        text: 'Gespeichert',
        icon: <CheckCircle className="w-4 h-4" />,
        className: 'bg-green-600 text-white',
        disabled: false
      };
    } else if (currentStatus === 'error') {
      return {
        text: 'Fehler - Retry',
        icon: <AlertCircle className="w-4 h-4" />,
        className: 'bg-red-600 text-white',
        disabled: false
      };
    } else if (grade === null) {
      return {
        text: 'NULL speichern',
        icon: <Trash2 className="w-4 h-4" />,
        className: 'bg-purple-600 text-white hover:bg-purple-700',
        disabled: false
      };
    }
    
    return {
      text: 'Note speichern',
      icon: <Save className="w-4 h-4" />,
      className: 'bg-blue-600 text-white hover:bg-blue-700',
      disabled: false
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className={`auto-save-grade-input ${className}`}>
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-3 p-3 bg-gray-50 rounded border">
          <h4 className="text-sm font-medium text-gray-700">
            Auto-Save Noteneingabe
            {currentStatus && (
              <span className="ml-2 text-xs">
                {currentStatus === 'saving' && '💾 Speichert...'}
                {currentStatus === 'success' && '✅ Gespeichert'}
                {currentStatus === 'error' && '❌ Fehler'}
              </span>
            )}
          </h4>
          
          {/* Grade Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="number"
              min="0"
              max="18"
              step="0.5"
              placeholder={placeholder}
              value={grade !== null ? grade : ''}
              onChange={(e) => handleGradeChange(e.target.value)}
              onBlur={handleAutoSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  handleAutoSave();
                }
              }}
              disabled={disabled}
              
              // Maximale Autofill-Prävention
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              data-chrome-autofill="disabled"
              name={randomId}
              id={randomId}
              
              className={getInputStyles()}
            />
            
            {/* Validierungs-Icon */}
            {grade !== null && !isValidGrade(grade) && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
            )}
          </div>

          {/* Grade Description Textarea */}
          <textarea
            ref={textareaRef}
            placeholder={
              grade === null 
                ? "Notenbeschreibung (Note eingeben für automatische Beschreibung)"
                : "Notenbeschreibung (optional)"
            }
            value={gradeText}
            onChange={(e) => setGradeText(e.target.value)}
            onBlur={handleAutoSave}
            disabled={disabled}
            rows={2}
            
            // Autofill-Prävention für Textarea
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            name={`${randomId}-description`}
            id={`${randomId}-description`}
            
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     resize-none transition-colors"
          />

          {/* Validierungshinweise */}
          {grade !== null && !isValidGrade(grade) && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Ungültige Note (0-18 erlaubt) - trotzdem speicherbar
            </p>
          )}

          {/* Manual Save Button */}
          <button
            type="button"
            onClick={handleManualSave}
            disabled={disabled || buttonConfig.disabled}
            className={`
              w-full px-4 py-2 text-sm rounded transition-all duration-200 
              flex items-center justify-center gap-2
              ${buttonConfig.className}
              ${!buttonConfig.disabled ? 'hover:scale-105 active:scale-95' : ''}
            `}
          >
            {buttonConfig.icon}
            {buttonConfig.text}
          </button>

          {/* Status-Anzeige */}
          {(currentGrade !== undefined && currentGrade !== null) && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="text-blue-800">
                <strong>Aktuelle Note:</strong> {currentGrade} Punkte
                {currentGradeText && ` (${currentGradeText})`}
              </p>
            </div>
          )}
          
          {/* Debug-Info (nur in Development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-gray-100 border rounded text-xs text-gray-600">
              <p><strong>Debug:</strong> Case ID: {caseStudyId}</p>
              <p>Grade: {grade === null ? 'NULL' : grade}</p>
              <p>Status: {currentStatus || 'idle'}</p>
              <p>Valid: {isValidGrade(grade) ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AutoSaveGradeInput;
