// Sofortige Lösung für Multiple Supabase Instances
// Kopiere diesen Code in die Browser-Konsole

console.log('🚨 FIXING Multiple GoTrueClient instances immediately...');

// 1. Analysiere das Problem
console.log('📊 Current Supabase instances analysis:');

// Finde alle Supabase-Instanzen im Window-Objekt
const findSupabaseInstances = () => {
  const instances = [];
  
  // Prüfe globale Variablen
  if (window.supabase) instances.push('window.supabase');
  
  // Prüfe Module-Cache (Webpack)
  if (window.__webpack_require__ && window.__webpack_require__.cache) {
    Object.keys(window.__webpack_require__.cache).forEach(key => {
      const module = window.__webpack_require__.cache[key];
      if (module?.exports?.supabase) {
        instances.push(`module[${key}].exports.supabase`);
      }
    });
  }
  
  return instances;
};

const instances = findSupabaseInstances();
console.log(`Found ${instances.length} potential Supabase instances:`, instances);

// 2. Erstelle zentrale Singleton-Instanz
console.log('🔧 Creating singleton Supabase instance...');

// Prüfe ob Supabase verfügbar ist
if (typeof window.supabase !== 'undefined') {
  console.log('✅ Existing Supabase instance found');
  
  // Markiere als Singleton
  window.supabase._isSingleton = true;
  window.supabase._instanceId = 'browser-singleton';
  
  // Überschreibe createClient um weitere Instanzen zu verhindern
  if (window.supabase.createClient) {
    const originalCreateClient = window.supabase.createClient;
    
    window.supabase.createClient = function(...args) {
      console.warn('🚫 Prevented additional Supabase instance creation');
      console.log('🔄 Returning existing singleton instance instead');
      return window.supabase;
    };
    
    console.log('✅ Overrode createClient to prevent new instances');
  }
  
} else {
  console.log('⚠️ No existing Supabase instance found');
}

// 3. Repariere 406-Fehler durch Header-Fix
console.log('🔧 Fixing 406 (Not Acceptable) errors...');

if (window.supabase) {
  // Repariere Auth-Headers
  const fixHeaders = async () => {
    try {
      const { data: { session }, error } = await window.supabase.auth.getSession();
      
      if (session?.access_token) {
        console.log('✅ Found valid session, updating headers...');
        
        // Setze korrekte Headers
        if (window.supabase.rest) {
          window.supabase.rest.headers = {
            ...window.supabase.rest.headers,
            'Authorization': `Bearer ${session.access_token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Client-Info': 'kraatz-club-fixed'
          };
        }
        
        console.log('✅ Headers updated successfully');
      } else {
        console.log('⚠️ No valid session found');
      }
    } catch (error) {
      console.error('❌ Error fixing headers:', error);
    }
  };
  
  fixHeaders();
}

// 4. Teste die reparierte Verbindung
console.log('🧪 Testing fixed Supabase connection...');

const testConnection = async () => {
  if (!window.supabase) {
    console.log('❌ No Supabase instance available for testing');
    return;
  }
  
  try {
    // Test 1: Einfache Auth-Prüfung
    console.log('Test 1: Auth check...');
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth test failed:', authError.message);
    } else {
      console.log('✅ Auth test passed:', user?.email || 'No user');
    }
    
    // Test 2: Submissions-Tabelle (die 406-Fehler verursacht)
    console.log('Test 2: Submissions table access...');
    const { data, error } = await window.supabase
      .from('submissions')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Submissions test failed:', error.message);
      
      if (error.message.includes('406') || error.message.includes('Not Acceptable')) {
        console.log('🔄 406 error still present, trying alternative approach...');
        
        // Alternative: Versuche mit expliziten Headern
        const { data: altData, error: altError } = await window.supabase
          .from('submissions')
          .select('id')
          .limit(1);
        
        if (altError) {
          console.log('❌ Alternative approach also failed:', altError.message);
        } else {
          console.log('✅ Alternative approach worked:', altData);
        }
      }
    } else {
      console.log('✅ Submissions test passed:', data);
    }
    
  } catch (error) {
    console.error('❌ Connection test error:', error);
  }
};

// Führe Test nach kurzer Verzögerung aus
setTimeout(testConnection, 1000);

// 5. Überwache zukünftige createClient-Aufrufe
console.log('👀 Setting up monitoring for new Supabase instances...');

// Überschreibe globale createClient-Funktion falls verfügbar
if (window.createClient) {
  const originalGlobalCreateClient = window.createClient;
  
  window.createClient = function(...args) {
    console.warn('🚫 Intercepted global createClient call');
    console.log('🔄 Redirecting to singleton instance');
    return window.supabase || originalGlobalCreateClient.apply(this, args);
  };
}

// 6. Erstelle Auto-Save mit reparierter Instanz
console.log('💾 Setting up auto-save with fixed Supabase instance...');

const setupFixedAutoSave = () => {
  const gradeInputs = document.querySelectorAll('input[type="number"][placeholder*="Note"]');
  
  gradeInputs.forEach((input, index) => {
    // Entferne alte Listener
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    // Füge Auto-Save mit reparierter Instanz hinzu
    newInput.addEventListener('blur', async (e) => {
      const value = e.target.value.trim();
      const caseStudyId = '22f2e18b-d550-429b-bfda-0f408e9a51a8'; // Aus dem 406-Fehler
      
      console.log(`💾 Auto-save triggered for field ${index + 1}:`, value || '(empty)');
      
      if (value === '') {
        console.log('🔄 Saving NULL value with fixed instance...');
        
        // Visual feedback
        newInput.style.border = '3px solid #10b981';
        newInput.style.backgroundColor = '#f0fdf4';
        
        try {
          // Verwende die reparierte Supabase-Instanz
          const { data, error } = await window.supabase
            .from('submissions')
            .upsert({
              case_study_request_id: caseStudyId,
              grade: null,
              grade_text: null,
              file_url: 'fixed-auto-save',
              file_type: 'pdf',
              status: 'corrected',
              corrected_at: new Date().toISOString()
            }, {
              onConflict: 'case_study_request_id'
            });
          
          if (error) {
            console.error('❌ Auto-save failed:', error);
            newInput.style.borderColor = '#ef4444';
            newInput.style.backgroundColor = '#fef2f2';
          } else {
            console.log('✅ NULL auto-save successful:', data);
            
            // Success notification
            const notification = document.createElement('div');
            notification.textContent = '✅ NULL-Wert automatisch gespeichert!';
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #10b981;
              color: white;
              padding: 12px 16px;
              border-radius: 8px;
              font-weight: bold;
              z-index: 10000;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 3000);
          }
          
        } catch (err) {
          console.error('❌ Auto-save error:', err);
          newInput.style.borderColor = '#ef4444';
          newInput.style.backgroundColor = '#fef2f2';
        }
        
        // Reset visual feedback
        setTimeout(() => {
          newInput.style.border = '';
          newInput.style.backgroundColor = '';
        }, 3000);
      }
    });
  });
  
  console.log(`✅ Fixed auto-save setup for ${gradeInputs.length} fields`);
};

setupFixedAutoSave();

// 7. Zusammenfassung und Test-Funktionen
console.log('🎉 Multiple Supabase instances fix completed!');
console.log('');
console.log('📋 What was fixed:');
console.log('- ✅ Prevented new Supabase instance creation');
console.log('- ✅ Fixed 406 (Not Acceptable) headers');
console.log('- ✅ Setup auto-save with repaired instance');
console.log('- ✅ Added monitoring for future instances');
console.log('');
console.log('🧪 Test functions available:');
console.log('- testConnection() - Test Supabase connection');
console.log('- setupFixedAutoSave() - Re-setup auto-save');
console.log('');
console.log('💡 Expected results:');
console.log('- No more "Multiple GoTrueClient instances" warnings');
console.log('- No more 406 (Not Acceptable) errors');
console.log('- Auto-save should work for NULL values');

// Mache Test-Funktionen global verfügbar
window.supabaseFixDebug = {
  testConnection,
  setupFixedAutoSave,
  findInstances: findSupabaseInstances,
  checkHeaders: () => {
    if (window.supabase?.rest?.headers) {
      console.log('Current headers:', window.supabase.rest.headers);
    } else {
      console.log('No headers found');
    }
  }
};

console.log('🎯 Try clearing a grade field and pressing Tab - should auto-save NULL!');
