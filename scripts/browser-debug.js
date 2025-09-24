// Browser-Debug-Script für Supabase & NULL-Probleme
// Kopiere diesen Code in die Browser-Konsole

console.log('🔍 Starting Supabase & NULL debugging...');

// 1. Prüfe Supabase-Instanzen
console.group('📊 Supabase Instances');
const instances = window.__supabaseInstances || [];
console.log('Instance count:', instances.length);
if (instances.length > 1) {
  console.warn('⚠️ Multiple instances detected!');
  instances.forEach((inst, i) => console.log(`Instance ${i+1}:`, inst));
} else {
  console.log('✅ Single instance (correct)');
}
console.groupEnd();

// 2. Prüfe Button-Status
console.group('🔘 Button Status');
const noteButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
  btn.textContent.includes('Note speichern') || btn.textContent.includes('Note löschen')
);
console.log('Note buttons found:', noteButtons.length);
noteButtons.forEach((btn, i) => {
  console.log(`Button ${i+1}:`, {
    text: btn.textContent.trim(),
    disabled: btn.disabled,
    className: btn.className
  });
});
console.groupEnd();

// 3. Prüfe Input-Felder
console.group('📝 Input Fields');
const gradeInputs = document.querySelectorAll('input[type="number"][placeholder*="Note"]');
console.log('Grade inputs found:', gradeInputs.length);
gradeInputs.forEach((input, i) => {
  console.log(`Input ${i+1}:`, {
    value: input.value,
    placeholder: input.placeholder,
    disabled: input.disabled,
    autocomplete: input.getAttribute('autocomplete')
  });
});
console.groupEnd();

// 4. Test NULL-Speicherung (falls Supabase verfügbar)
if (typeof supabase !== 'undefined') {
  console.group('🧪 NULL Value Test');
  
  const testNullSave = async () => {
    try {
      console.log('Testing NULL value insertion...');
      
      const testData = {
        case_study_request_id: 'debug-test-' + Date.now(),
        file_url: 'debug-test',
        file_type: 'pdf',
        status: 'corrected',
        grade: null,
        grade_text: null,
        corrected_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('submissions')
        .insert(testData)
        .select();
      
      if (error) {
        console.error('❌ NULL test failed:', error);
      } else {
        console.log('✅ NULL test successful:', data);
        
        // Cleanup
        if (data?.[0]?.id) {
          await supabase.from('submissions').delete().eq('id', data[0].id);
          console.log('🧹 Test data cleaned up');
        }
      }
    } catch (err) {
      console.error('❌ NULL test error:', err);
    }
  };
  
  testNullSave();
  console.groupEnd();
} else {
  console.log('⚠️ Supabase not available for testing');
}

// 5. Temporäre Button-Aktivierung
console.group('🔧 Temporary Fixes');
console.log('Applying temporary button fixes...');

// Aktiviere alle Note-Buttons
let fixedButtons = 0;
noteButtons.forEach(btn => {
  if (btn.disabled) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.backgroundColor = btn.textContent.includes('löschen') ? '#dc2626' : '#2563eb';
    fixedButtons++;
  }
});

console.log(`✅ Fixed ${fixedButtons} disabled buttons`);

// Füge Autocomplete-Attribute hinzu
let fixedInputs = 0;
gradeInputs.forEach(input => {
  if (!input.getAttribute('autocomplete')) {
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-1p-ignore', 'true');
    fixedInputs++;
  }
});

console.log(`✅ Fixed ${fixedInputs} input autocomplete attributes`);
console.groupEnd();

// 6. Monitoring-Setup
console.group('👀 Monitoring Setup');
console.log('Setting up change monitoring...');

// Monitor für Button-Änderungen
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
      const target = mutation.target;
      if (target.textContent && target.textContent.includes('Note')) {
        console.log('🔄 Button state changed:', {
          text: target.textContent.trim(),
          disabled: target.disabled,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }
  });
});

// Starte Monitoring für alle Buttons
noteButtons.forEach(btn => {
  observer.observe(btn, { attributes: true, attributeFilter: ['disabled'] });
});

console.log('✅ Button monitoring active');
console.groupEnd();

// 7. Zusammenfassung
console.group('📋 Summary');
console.log('Debug analysis complete!');
console.log('Issues found:');
console.log(`- Multiple Supabase instances: ${instances.length > 1 ? '❌ YES' : '✅ NO'}`);
console.log(`- Disabled buttons: ${noteButtons.filter(b => b.disabled).length > 0 ? '❌ YES' : '✅ NO'}`);
console.log(`- Missing autocomplete: ${Array.from(gradeInputs).filter(i => !i.getAttribute('autocomplete')).length > 0 ? '❌ YES' : '✅ NO'}`);

console.log('\nRecommended actions:');
if (instances.length > 1) console.log('1. Fix Supabase singleton pattern');
if (noteButtons.filter(b => b.disabled).length > 0) console.log('2. Remove button disabled attributes');
if (Array.from(gradeInputs).filter(i => !i.getAttribute('autocomplete')).length > 0) console.log('3. Add autocomplete="off" to inputs');

console.log('\n🔄 Run ./scripts/fix-supabase-instances-and-null.sh to fix all issues');
console.groupEnd();

// 8. Hilfsfunktionen für weitere Tests
window.debugKraatz = {
  testNullSave: async (caseStudyId) => {
    if (typeof supabase === 'undefined') {
      console.error('Supabase not available');
      return;
    }
    
    const { data, error } = await supabase
      .from('submissions')
      .update({ grade: null, grade_text: null })
      .eq('case_study_request_id', caseStudyId)
      .select();
    
    console.log('NULL save test:', { data, error });
    return { data, error };
  },
  
  enableAllButtons: () => {
    const buttons = document.querySelectorAll('button[disabled]');
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '1';
    });
    console.log(`Enabled ${buttons.length} buttons`);
  },
  
  checkSupabaseHealth: () => {
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase not available');
      return false;
    }
    
    console.log('✅ Supabase available');
    console.log('Auth user:', supabase.auth.getUser());
    return true;
  }
};

console.log('🎯 Debug functions available as window.debugKraatz');
console.log('Example: debugKraatz.enableAllButtons()');
console.log('Example: debugKraatz.testNullSave("case-id-123")');
console.log('Example: debugKraatz.checkSupabaseHealth()');

console.log('🏁 Debug script completed!');
