import React, { useState } from 'react';
import { Trash2, Save, RotateCcw } from 'lucide-react';

interface EnhancedGradeInputProps {
  requestId: string;
  currentGrade?: number;
  currentGradeText?: string;
  onSave: (grade: number, gradeText: string) => void;
  onRemove: () => void;
  saveStatus?: 'saving' | 'success' | 'error' | null;
}

const EnhancedGradeInput: React.FC<EnhancedGradeInputProps> = ({
  requestId,
  currentGrade,
  currentGradeText,
  onSave,
  onRemove,
  saveStatus
}) => {
  const [grade, setGrade] = useState<number | undefined>(currentGrade);
  const [gradeText, setGradeText] = useState(currentGradeText || '');

  // Erweiterte Notenbeschreibung (inkl. 0 Punkte)
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

  const handleGradeChange = (value: string) => {
    if (value === '') {
      setGrade(undefined);
      setGradeText('');
    } else {
      const numericGrade = parseFloat(value);
      setGrade(numericGrade);
      
      // Automatische Beschreibung nur wenn gültige Note
      if (numericGrade >= 0 && numericGrade <= 18) {
        setGradeText(getGradeDescription(numericGrade));
      }
    }
  };

  const handleSave = () => {
    if (grade !== undefined && grade >= 0 && grade <= 18) {
      onSave(grade, gradeText);
    }
  };

  const handleReset = () => {
    setGrade(undefined);
    setGradeText('');
  };

  const isValidGrade = grade !== undefined && grade >= 0 && grade <= 18;
  const hasGrade = grade !== undefined;

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded border">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Note eingeben</h4>
      
      <div className="flex flex-col gap-2">
        {/* Noteneingabe */}
        <div className="relative">
          <input
            type="number"
            min="0"
            max="18"
            step="0.5"
            placeholder="Note (0-18)"
            value={grade !== undefined ? grade : ''}
            onChange={(e) => handleGradeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
          />
          
          {/* Reset Button */}
          {hasGrade && (
            <button
              onClick={handleReset}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Note zurücksetzen"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Notenbeschreibung */}
        <textarea
          placeholder="Notenbeschreibung (optional)"
          value={gradeText}
          onChange={(e) => setGradeText(e.target.value)}
          rows={2}
          className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />

        {/* Validierungshinweis */}
        {grade !== undefined && !isValidGrade && (
          <p className="text-xs text-red-600">
            Bitte geben Sie eine Note zwischen 0 und 18 ein.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Speichern Button */}
          <button
            onClick={handleSave}
            disabled={!isValidGrade || saveStatus === 'saving'}
            className={`flex-1 px-4 py-2 text-white text-sm rounded transition-colors flex items-center justify-center gap-2 ${
              saveStatus === 'saving' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : saveStatus === 'success'
                ? 'bg-green-600 hover:bg-green-700'
                : saveStatus === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' 
              ? 'Speichert...' 
              : saveStatus === 'success'
              ? '✓ Gespeichert'
              : saveStatus === 'error'
              ? '✗ Fehler'
              : 'Note speichern'
            }
          </button>

          {/* Entfernen Button */}
          {currentGrade !== undefined && (
            <button
              onClick={onRemove}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1"
              title="Note entfernen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Aktuelle Note Anzeige */}
        {currentGrade !== undefined && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-800">
              <strong>Aktuelle Note:</strong> {currentGrade} Punkte
              {currentGradeText && ` (${currentGradeText})`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedGradeInput;
