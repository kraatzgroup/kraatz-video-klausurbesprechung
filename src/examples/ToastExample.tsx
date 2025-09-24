import React from 'react';
import { useToastContext } from '../contexts/ToastContext';

// Beispiel-Komponente, die zeigt, wie das Toast-System verwendet wird
const ToastExample: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToastContext();

  // Beispiele für verschiedene Toast-Typen
  const handleSuccess = () => {
    showSuccess('Note erfolgreich gespeichert!', 'Die Note wurde in der Datenbank aktualisiert.');
  };

  const handleError = () => {
    showError('Fehler beim Speichern', 'Bitte versuchen Sie es erneut.');
  };

  const handleWarning = () => {
    showWarning('Ungültige Note', 'Bitte geben Sie eine Note zwischen 0 und 18 ein.');
  };

  const handleInfo = () => {
    showInfo('Information', 'Dies ist eine Info-Nachricht.');
  };

  // Beispiel für die Verwendung der globalen alert() Funktion
  const handleGlobalAlert = () => {
    // Diese wird automatisch als Toast angezeigt
    alert('Note erfolgreich gespeichert!');
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">Toast Notification Examples</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleSuccess}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Success Toast
        </button>
        
        <button
          onClick={handleError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Error Toast
        </button>
        
        <button
          onClick={handleWarning}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Warning Toast
        </button>
        
        <button
          onClick={handleInfo}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Info Toast
        </button>
        
        <button
          onClick={handleGlobalAlert}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 col-span-2"
        >
          Global Alert (wird als Toast angezeigt)
        </button>
      </div>
    </div>
  );
};

export default ToastExample;
