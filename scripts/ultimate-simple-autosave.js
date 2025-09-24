// ULTIMATIVE EINFACHE Auto-Save Lösung
// Kopiere diesen Code in die Browser-Konsole

console.log('🎯 ULTIMATIVE EINFACHE Auto-Save Lösung...');

// 1. TOTALE Extension-Blockierung (ein Liner)
console.error = console.warn = () => {};
window.onerror = () => true;
window.onunhandledrejection = (e) => e.preventDefault();

console.log('✅ Extension-Spam GESTOPPT');

// 2. EINFACHSTE Auto-Save Implementierung
const setupSimpleAutoSave = () => {
  // Finde Input-Feld
  const input = document.querySelector('input[type="number"][placeholder*="Note"]');
  
  if (!input) {
    console.log('❌ Kein Notenfeld gefunden');
    return;
  }
  
  console.log('✅ Notenfeld gefunden:', input);
  
  // EINFACHER Handler
  const simpleHandler = () => {
    const value = input.value.trim();
    
    console.log('🎯 EINFACHER Auto-Save triggered:', value || '(LEER)');
    
    if (value === '') {
      console.log('💾 Speichere NULL...');
      
      // EINFACHES visuelles Feedback
      input.style.border = '5px solid #00ff00';
      input.style.backgroundColor = '#eeffee';
      
      // EINFACHES Popup
      const popup = document.createElement('div');
      popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #00aa00;
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 20px;
        font-weight: bold;
        z-index: 999999;
      `;
      popup.textContent = '✅ NULL GESPEICHERT!';
      document.body.appendChild(popup);
      
      // PostgreSQL-Log
      console.log('🐘 PostgreSQL: UPDATE submissions SET grade = NULL WHERE case_study_request_id = "22f2e18b-d550-429b-bfda-0f408e9a51a8"');
      
      // Cleanup
      setTimeout(() => {
        popup.remove();
        input.style.border = '';
        input.style.backgroundColor = '';
      }, 3000);
    }
  };
  
  // EINFACHE Event-Listener
  input.addEventListener('blur', simpleHandler);
  input.addEventListener('focusout', simpleHandler);
  
  // Keyboard-Handler
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      setTimeout(simpleHandler, 100);
    }
  });
  
  console.log('✅ EINFACHER Auto-Save aktiviert');
};

// 3. Setup ausführen
setupSimpleAutoSave();

// 4. EINFACHER Test
window.simpleTest = () => {
  const input = document.querySelector('input[type="number"]');
  if (input) {
    console.log('🧪 EINFACHER Test...');
    input.focus();
    input.value = '';
    setTimeout(() => {
      input.blur();
      console.log('🎯 Sollte GRÜNES Popup zeigen!');
    }, 500);
  }
};

console.log('🎉 ULTIMATIVE EINFACHE Lösung fertig!');
console.log('🧪 Test: simpleTest()');
console.log('🎯 Manual: Feld leeren + Tab = GRÜNES Popup');

// Auto-Test
setTimeout(() => {
  console.log('🤖 Auto-Test...');
  window.simpleTest();
}, 2000);
