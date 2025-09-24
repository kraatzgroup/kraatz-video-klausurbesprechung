import React, { useState, useEffect } from 'react';
import { Save, Trash2, AlertCircle } from 'lucide-react';

interface SecureGradeInputProps {
  requestId: string;
  currentGrade?: number | null;
  currentGradeText?: string;
  onSave: (grade: number | null, gradeText: string) => void;
  onRemove?: () => void;
  saveStatus?: 'saving' | 'success' | 'error' | null;
  disabled?: boolean;
}

const SecureGradeInput: React.FC<SecureGradeInputProps> = ({
  requestId,
  currentGrade,
  currentGradeText,
  onSave,
  onRemove,
  saveStatus,
  disabled = false
}) => {
  const [grade, setGrade] = useState<number | null>(currentGrade ?? null);
  const [gradeText, setGradeText] = useState(currentGradeText || '');
  const [randomId] = useState(() => `grade-${Math.random().toString(36).substr(2, 9)}`);

  // Sync with props
  useEffect(() => {
    setGrade(currentGrade ?? null);
    setGradeText(currentGradeText || '');
  }, [currentGrade, currentGradeText]);

  // Erweiterte Notenbeschreibung
  const getGradeDescription = (points: number | null): string => {
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

  const handleGradeChange = (value: string) => {
    const trimmedValue = value.trim();
    
    if (trimmedValue === '') {
      setGrade(null);
      setGradeText('');
    } else {
      const parsedGrade = parseFloat(trimmedValue);
      setGrade(parsedGrade);
      
      // Automatische Beschreibung nur bei gültigen Noten
      if (!isNaN(parsedGrade) && parsedGrade >= 0 && parsedGrade <= 18) {
        setGradeText(getGradeDescription(parsedGrade));
      } else {
        setGradeText('');
      }
    }
  };

  const handleSave = () => {
    onSave(grade, gradeText);
  };

  const isValidGrade = grade === null || (grade >= 0 && grade <= 18);
  const hasExistingGrade = currentGrade !== undefined && currentGrade !== null;

  const getButtonConfig = () => {
    if (grade === null || grade === undefined) {
      return {
        text: 'Note löschen',
        className: 'bg-red-600 hover:bg-red-700',
        icon: <Trash2 className="w-4 h-4" />,
        tooltip: 'Leeres Feld speichert NULL-Wert (löscht bestehende Note)'
      };
    }
    
    return {
      text: 'Note speichern',
      className: 'bg-blue-600 hover:bg-blue-700',
      icon: <Save className="w-4 h-4" />,
      tooltip: 'Note in Datenbank speichern'
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      <div className="mt-3 p-3 bg-gray-50 rounded border">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Note eingeben</h4>
        
        <div className="flex flex-col gap-2">
          {/* Sicheres Noteneingabe-Feld */}
          <div className="relative">
            <input
              type="number"
              min="0"
              max="18"
              step="0.5"
              placeholder="Note (0-18) - Leer = Note löschen"
              value={grade !== null ? grade : ''}
              onChange={(e) => handleGradeChange(e.target.value)}
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
              
              className={`w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                grade === null 
                  ? 'border-red-300 bg-red-50' 
                  : !isValidGrade
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-300 bg-white'
              }`}
            />
            
            {/* Validierungs-Icon */}
            {grade !== null && !isValidGrade && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
            )}
          </div>

          {/* Sichere Beschreibungs-Textarea */}
          <textarea
            placeholder={
              grade === null 
                ? "Notenbeschreibung (Note eingeben für automatische Beschreibung)"
                : "Notenbeschreibung (optional)"
            }
            value={gradeText}
            onChange={(e) => setGradeText(e.target.value)}
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
            
            className={`px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-colors ${
              gradeText === '' ? 'bg-gray-50' : 'bg-white'
            }`}
          />

          {/* Validierungshinweise */}
          {grade !== null && !isValidGrade && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Ungültige Note (0-18 erlaubt) - trotzdem speicherbar
            </p>
          )}

          {/* Button-Container */}
          <div className="flex gap-2">
            {/* Haupt-Speicher-Button - IMMER aktiviert */}
            <button
              type="button"
              onClick={handleSave}
              disabled={disabled || saveStatus === 'saving'}
              title={buttonConfig.tooltip}
              className={`flex-1 px-4 py-2 text-white text-sm rounded transition-all duration-200 flex items-center justify-center gap-2 ${
                saveStatus === 'saving'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : saveStatus === 'success'
                  ? 'bg-green-600 hover:bg-green-700'
                  : saveStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : buttonConfig.className
              } hover:scale-105 active:scale-95`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Speichert...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  ✓ Gespeichert
                </>
              ) : saveStatus === 'error' ? (
                <>
                  ✗ Fehler
                </>
              ) : (
                <>
                  {buttonConfig.icon}
                  {buttonConfig.text}
                </>
              )}
            </button>

            {/* Entfernen-Button (nur bei bestehender Note) */}
            {hasExistingGrade && onRemove && (
              <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                title="Note komplett aus Datenbank entfernen"
                className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status-Anzeige */}
          {hasExistingGrade && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="text-blue-800">
                <strong>Gespeicherte Note:</strong> {currentGrade} Punkte
                {currentGradeText && ` (${currentGradeText})`}
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default SecureGradeInput;
