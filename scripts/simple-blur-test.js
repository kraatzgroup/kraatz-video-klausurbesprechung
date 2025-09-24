// Einfacher Test für Auto-Save bei leerem Feld
// Kopiere diesen Code in die Browser-Konsole

console.log('🧪 SIMPLE BLUR TEST - Testing empty field auto-save...');

// Finde das erste Noteneingabe-Feld
const input = document.querySelector('input[type="number"][placeholder*="Note"]');

if (!input) {
  console.error('❌ No grade input field found!');
} else {
  console.log('✅ Found grade input field:', input);
  
  // Entferne alle bestehenden Event-Listener
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);
  
  // Füge einfachen, robusten onBlur-Handler hinzu
  newInput.addEventListener('blur', function(e) {
    const value = e.target.value.trim();
    
    console.log('🎯 BLUR EVENT TRIGGERED!');
    console.log('Field value:', value === '' ? '(EMPTY)' : value);
    console.log('Timestamp:', new Date().toLocaleTimeString());
    
    if (value === '') {
      console.log('💾 EMPTY FIELD DETECTED - SHOULD SAVE NULL!');
      
      // Starkes visuelles Feedback
      e.target.style.border = '5px solid red';
      e.target.style.backgroundColor = '#ffeeee';
      
      // Zeige Popup-Bestätigung
      const popup = document.createElement('div');
      popup.textContent = '🔴 NULL SAVE TRIGGERED!';
      popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: red;
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 20px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 0 20px rgba(255,0,0,0.5);
      `;
      document.body.appendChild(popup);
      
      // Entferne Popup nach 3 Sekunden
      setTimeout(() => {
        popup.remove();
        e.target.style.border = '';
        e.target.style.backgroundColor = '';
      }, 3000);
      
      // Hier würde die echte Speicherung stattfinden
      console.log('📡 Would save NULL to database here');
      
    } else {
      console.log('ℹ️ Field has value, not empty');
    }
  });
  
  // Füge auch focusout als Backup hinzu
  newInput.addEventListener('focusout', function(e) {
    console.log('🔄 FOCUSOUT event (backup)');
    // Trigger blur if not already triggered
    setTimeout(() => newInput.blur(), 10);
  });
  
  console.log('✅ Event listeners added to input field');
  console.log('');
  console.log('🧪 MANUAL TEST:');
  console.log('1. Click in the grade input field');
  console.log('2. Clear the field (make it empty)');
  console.log('3. Press Tab or click elsewhere');
  console.log('4. You should see a RED POPUP saying "NULL SAVE TRIGGERED!"');
  console.log('');
  console.log('🤖 AUTOMATIC TEST:');
  console.log('autoTest() - Runs automatic test');
  
  // Automatischer Test
  window.autoTest = () => {
    console.log('🤖 Running automatic test...');
    
    // Fokussiere das Feld
    newInput.focus();
    console.log('Step 1: Focused field');
    
    setTimeout(() => {
      // Leere das Feld
      newInput.value = '';
      console.log('Step 2: Cleared field');
      
      setTimeout(() => {
        // Trigger blur
        newInput.blur();
        console.log('Step 3: Triggered blur - should see red popup!');
      }, 500);
    }, 500);
  };
  
  // Führe automatischen Test in 2 Sekunden aus
  setTimeout(() => {
    console.log('🚀 Auto-running test in 2 seconds...');
    window.autoTest();
  }, 2000);
}

console.log('🎯 Setup complete! Watch for the red popup when field is cleared and blurred.');
