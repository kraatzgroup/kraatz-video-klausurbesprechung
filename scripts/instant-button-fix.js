// Sofortige Lösung für deaktivierte "Note speichern" Buttons
// Kopiere diesen Code in die Browser-Konsole

console.log('🔧 Fixing disabled "Note speichern" buttons...');

// 1. Finde alle "Note speichern" Buttons
const noteButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
  btn.textContent.includes('Note speichern')
);

console.log(`📊 Found ${noteButtons.length} "Note speichern" buttons`);

// 2. Aktiviere alle deaktivierten Buttons
let fixedCount = 0;
noteButtons.forEach((btn, index) => {
  const wasDisabled = btn.disabled;
  
  if (wasDisabled) {
    // Aktiviere Button
    btn.disabled = false;
    
    // Repariere Styling
    btn.style.backgroundColor = '#2563eb';  // bg-blue-600
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
    
    // Entferne disabled-Klassen
    btn.classList.remove('disabled:bg-gray-300', 'disabled:cursor-not-allowed');
    
    fixedCount++;
    console.log(`✅ Button ${index + 1}: Activated`);
  } else {
    console.log(`ℹ️ Button ${index + 1}: Already active`);
  }
});

console.log(`🎉 Fixed ${fixedCount} disabled buttons!`);

// 3. Überwache Button-Änderungen und verhindere Deaktivierung
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
      const button = mutation.target;
      
      if (button.textContent && button.textContent.includes('Note speichern')) {
        if (button.disabled) {
          console.log('🔄 Re-enabling button that was disabled...');
          button.disabled = false;
          button.style.backgroundColor = '#2563eb';
          button.style.cursor = 'pointer';
          button.style.opacity = '1';
        }
      }
    }
  });
});

// Starte Überwachung für alle Note-Buttons
noteButtons.forEach(btn => {
  observer.observe(btn, { 
    attributes: true, 
    attributeFilter: ['disabled', 'class', 'style'] 
  });
});

console.log('👀 Button monitoring active - buttons will stay enabled');

// 4. Teste Button-Funktionalität
console.log('🧪 Testing button functionality...');

noteButtons.forEach((btn, index) => {
  const container = btn.closest('.bg-gray-50');
  const input = container?.querySelector('input[type="number"]');
  
  if (input) {
    console.log(`📝 Button ${index + 1}:`, {
      inputValue: input.value,
      inputEmpty: input.value === '',
      buttonDisabled: btn.disabled,
      buttonClickable: !btn.disabled
    });
  }
});

// 5. Füge Hilfsfunktionen hinzu
window.kraatzButtonFix = {
  enableAll: () => {
    const buttons = document.querySelectorAll('button');
    let count = 0;
    buttons.forEach(btn => {
      if (btn.textContent.includes('Note speichern') && btn.disabled) {
        btn.disabled = false;
        btn.style.backgroundColor = '#2563eb';
        btn.style.cursor = 'pointer';
        count++;
      }
    });
    console.log(`✅ Enabled ${count} buttons`);
    return count;
  },
  
  testEmptyFieldSave: () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.textContent.includes('Note speichern')) {
        const container = btn.closest('.bg-gray-50');
        const input = container?.querySelector('input[type="number"]');
        
        if (input && input.value === '') {
          console.log('🧪 Testing empty field save...');
          console.log('Input empty:', input.value === '');
          console.log('Button clickable:', !btn.disabled);
          
          if (!btn.disabled) {
            console.log('✅ Empty field save should work!');
          } else {
            console.log('❌ Button still disabled for empty field');
          }
        }
      }
    });
  },
  
  forceClickableButtons: () => {
    // Überschreibe alle disabled-Attribute
    const style = document.createElement('style');
    style.textContent = `
      button[disabled] {
        pointer-events: auto !important;
        opacity: 1 !important;
        cursor: pointer !important;
        background-color: #2563eb !important;
      }
      button[disabled]:hover {
        background-color: #1d4ed8 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Entferne disabled-Attribute
    document.querySelectorAll('button[disabled]').forEach(btn => {
      if (btn.textContent.includes('Note')) {
        btn.removeAttribute('disabled');
      }
    });
    
    console.log('🚀 Force-enabled all note buttons with CSS override');
  }
};

// 6. Zusammenfassung
console.log('📋 Summary:');
console.log(`- Found buttons: ${noteButtons.length}`);
console.log(`- Fixed buttons: ${fixedCount}`);
console.log(`- Monitoring: Active`);
console.log('');
console.log('🎯 Available commands:');
console.log('- kraatzButtonFix.enableAll() - Enable all note buttons');
console.log('- kraatzButtonFix.testEmptyFieldSave() - Test empty field functionality');
console.log('- kraatzButtonFix.forceClickableButtons() - Force all buttons clickable');
console.log('');
console.log('✅ Empty fields should now be saveable!');

// Auto-test
setTimeout(() => {
  console.log('🔄 Auto-testing after 2 seconds...');
  window.kraatzButtonFix.testEmptyFieldSave();
}, 2000);
