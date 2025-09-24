// Debug-Script für Notenvalidierung
// Führe diesen Code in der Browser-Konsole aus, um das Problem zu analysieren

console.log('🔍 Debugging Grade Input Issue...');

// 1. Prüfe aktuellen Zustand
const gradeInputs = document.querySelectorAll('input[type="number"][placeholder*="Note"]');
const saveButtons = document.querySelectorAll('button:contains("Note speichern")');

console.log('📊 Found elements:');
console.log('- Grade inputs:', gradeInputs.length);
console.log('- Save buttons:', saveButtons.length);

// 2. Analysiere jeden Grade Input
gradeInputs.forEach((input, index) => {
  console.log(`\n📝 Grade Input ${index + 1}:`);
  console.log('- Value:', input.value);
  console.log('- Disabled:', input.disabled);
  console.log('- Min:', input.min);
  console.log('- Max:', input.max);
  
  // Finde zugehörigen Button
  const container = input.closest('.bg-gray-50');
  const button = container?.querySelector('button');
  
  if (button) {
    console.log('- Button disabled:', button.disabled);
    console.log('- Button text:', button.textContent);
  }
});

// 3. Teste 0-Eingabe
console.log('\n🧪 Testing 0 input...');
if (gradeInputs.length > 0) {
  const firstInput = gradeInputs[0];
  
  // Simuliere 0-Eingabe
  firstInput.value = '0';
  firstInput.dispatchEvent(new Event('input', { bubbles: true }));
  firstInput.dispatchEvent(new Event('change', { bubbles: true }));
  
  setTimeout(() => {
    const container = firstInput.closest('.bg-gray-50');
    const button = container?.querySelector('button');
    const textarea = container?.querySelector('textarea');
    
    console.log('After entering 0:');
    console.log('- Input value:', firstInput.value);
    console.log('- Button disabled:', button?.disabled);
    console.log('- Textarea value:', textarea?.value);
  }, 100);
}

// 4. Prüfe React State (falls verfügbar)
console.log('\n⚛️ Checking React state...');
try {
  // Versuche React DevTools zu nutzen
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('React DevTools detected - check Components tab');
  }
  
  // Prüfe ob React Fiber verfügbar ist
  const reactFiber = gradeInputs[0]?._reactInternalFiber || gradeInputs[0]?._reactInternalInstance;
  if (reactFiber) {
    console.log('React Fiber found - state inspection possible');
  }
} catch (error) {
  console.log('React state inspection not available');
}

// 5. Gebe Lösungsvorschläge
console.log('\n💡 Potential solutions:');
console.log('1. Check button validation logic in onChange handler');
console.log('2. Ensure 0 is treated as valid grade (not falsy)');
console.log('3. Verify grade state is properly updated');
console.log('4. Check for TypeScript compilation errors');

// 6. Temporäre Lösung - Aktiviere alle Buttons
console.log('\n🚨 Emergency fix - Enable all buttons:');
console.log('Run this to temporarily enable all save buttons:');
console.log(`
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.includes('Note speichern')) {
    btn.disabled = false;
    btn.style.backgroundColor = '#2563eb';
    btn.style.cursor = 'pointer';
  }
});
`);

console.log('\n✅ Debug analysis complete!');
console.log('Check the output above and try the suggested solutions.');
