import React from 'react';
import { Check, X } from 'lucide-react';
import { getAllLegalAreas, type LegalArea } from '../utils/legalAreaUtils';

interface LegalAreaMultiSelectProps {
  selectedAreas: LegalArea[];
  onChange: (areas: LegalArea[]) => void;
  role: 'instructor' | 'springer';
  disabled?: boolean;
}

const LegalAreaMultiSelect: React.FC<LegalAreaMultiSelectProps> = ({
  selectedAreas,
  onChange,
  role,
  disabled = false
}) => {
  const allAreas = getAllLegalAreas();
  const rolePrefix = role === 'instructor' ? 'Dozent' : 'Springer';

  const toggleArea = (area: LegalArea) => {
    if (disabled) return;
    
    if (selectedAreas.includes(area)) {
      onChange(selectedAreas.filter(a => a !== area));
    } else {
      onChange([...selectedAreas, area]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(allAreas);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Rechtsgebiete für {rolePrefix}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={disabled || selectedAreas.length === allAreas.length}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Alle auswählen
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled || selectedAreas.length === 0}
            className="text-xs text-red-600 hover:text-red-800 disabled:text-gray-400"
          >
            Alle abwählen
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {allAreas.map((area) => {
          const isSelected = selectedAreas.includes(area);
          return (
            <div
              key={area}
              onClick={() => toggleArea(area)}
              className={`
                flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors
                ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                  }
                `}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {rolePrefix} {area}
                </span>
              </div>
              
              {isSelected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleArea(area);
                  }}
                  disabled={disabled}
                  className="p-1 text-gray-400 hover:text-red-500 disabled:hover:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedAreas.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            Ausgewählte Gebiete ({selectedAreas.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedAreas.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {area}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => toggleArea(area)}
                    className="hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {selectedAreas.length === 0 && (
        <div className="text-sm text-red-600">
          Bitte wählen Sie mindestens ein Rechtsgebiet aus.
        </div>
      )}
    </div>
  );
};

export default LegalAreaMultiSelect;
