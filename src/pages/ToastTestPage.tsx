import React from 'react';
import { useToastContext } from '../contexts/ToastContext';

export const ToastTestPage: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToastContext();

  const testSuccessToast = () => {
    showSuccess('Note gespeichert', 'Note 8 Punkte (befriedigend) wurde erfolgreich gespeichert.');
  };

  const testErrorToast = () => {
    showError('Fehler beim Speichern', 'Die Note konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.');
  };

  const testWarningToast = () => {
    showWarning('Warnung', 'Dies ist eine Warnmeldung für Tests.');
  };

  const testInfoToast = () => {
    showInfo('Information', 'Dies ist eine Informationsmeldung für Tests.');
  };

  const testGradeToasts = () => {
    const grades = [
      { grade: 18, desc: 'sehr gut' },
      { grade: 15, desc: 'gut' },
      { grade: 12, desc: 'vollbefriedigend' },
      { grade: 8, desc: 'befriedigend' },
      { grade: 5, desc: 'ausreichend' },
      { grade: 2, desc: 'mangelhaft' },
      { grade: 0, desc: 'ungenügend' }
    ];

    grades.forEach((g, index) => {
      setTimeout(() => {
        showSuccess('Note gespeichert', `Note ${g.grade} Punkte (${g.desc}) wurde erfolgreich gespeichert.`);
      }, index * 1000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Toast-Notifications Test</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Einzelne Toast-Tests</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={testSuccessToast}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  ✅ Success Toast
                </button>
                
                <button
                  onClick={testErrorToast}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  ❌ Error Toast
                </button>
                
                <button
                  onClick={testWarningToast}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  ⚠️ Warning Toast
                </button>
                
                <button
                  onClick={testInfoToast}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  ℹ️ Info Toast
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Noten-Toast-Simulation</h2>
              <button
                onClick={testGradeToasts}
                className="px-6 py-3 bg-kraatz-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🎯 Alle Noten-Toasts testen (7 Toasts in Folge)
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Testet alle Notenbereiche von 18 (sehr gut) bis 0 (ungenügend) mit 1-Sekunden-Abstand
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Erwartete Toast-Nachrichten:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ <strong>Success:</strong> "Note gespeichert: Note X Punkte (Beschreibung) wurde erfolgreich gespeichert."</li>
                <li>❌ <strong>Error:</strong> "Fehler beim Speichern: Die Note konnte nicht gespeichert werden..."</li>
                <li>⚠️ <strong>Warning:</strong> "Warnung: Dies ist eine Warnmeldung für Tests."</li>
                <li>ℹ️ <strong>Info:</strong> "Information: Dies ist eine Informationsmeldung für Tests."</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">🎯 So testen Sie die Toast-Notifications:</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Klicken Sie auf einen der Buttons oben</li>
                <li>Toast-Notification sollte unten links erscheinen</li>
                <li>Toast verschwindet automatisch nach 5 Sekunden</li>
                <li>Mehrere Toasts werden übereinander gestapelt</li>
                <li>Toasts können durch Klick auf X geschlossen werden</li>
              </ol>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">✅ Toast-System Status:</h3>
              <p className="text-sm text-green-700">
                Das Toast-System ist korrekt eingebunden und funktioniert. 
                Wenn Sie keine Toasts sehen, prüfen Sie die Browser-Konsole auf Fehler.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastTestPage;
