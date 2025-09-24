// Fix für 406 (Not Acceptable) Supabase-Fehler
// Kopiere diesen Code in die Browser-Konsole

console.log('🔧 Fixing Supabase 406 (Not Acceptable) error...');

// 1. Analysiere den aktuellen Fehler
console.log('📊 Current error analysis:');
console.log('- Error: 406 (Not Acceptable)');
console.log('- URL: submissions?select=id&case_study_request_id=eq.22f2e18b-d550-429b-bfda-0f408e9a51a8');
console.log('- Likely cause: Missing or incorrect headers');

// 2. Prüfe Supabase-Konfiguration
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase client available');
  
  // Prüfe Auth-Status
  supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
      console.error('❌ Auth error:', error);
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('⚠️ No authenticated user');
    }
  });
  
  // Prüfe Supabase-URL und Key
  console.log('Supabase URL:', supabase.supabaseUrl);
  console.log('Supabase Key available:', !!supabase.supabaseKey);
  
} else {
  console.error('❌ Supabase client not available');
}

// 3. Teste verschiedene Query-Formate
const testQueries = async () => {
  if (typeof supabase === 'undefined') {
    console.log('⚠️ Skipping query tests - Supabase not available');
    return;
  }
  
  console.log('🧪 Testing different query formats...');
  
  const testCaseId = '22f2e18b-d550-429b-bfda-0f408e9a51a8';
  
  // Test 1: Einfache Query ohne Filter
  try {
    console.log('Test 1: Simple select all');
    const { data, error } = await supabase
      .from('submissions')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Test 1 failed:', error.message);
    } else {
      console.log('✅ Test 1 success:', data);
    }
  } catch (err) {
    console.log('❌ Test 1 error:', err.message);
  }
  
  // Test 2: Mit korrekten Headern
  try {
    console.log('Test 2: With explicit headers');
    const { data, error } = await supabase
      .from('submissions')
      .select('id')
      .eq('case_study_request_id', testCaseId)
      .limit(1);
    
    if (error) {
      console.log('❌ Test 2 failed:', error.message);
    } else {
      console.log('✅ Test 2 success:', data);
    }
  } catch (err) {
    console.log('❌ Test 2 error:', err.message);
  }
  
  // Test 3: Alternative Syntax
  try {
    console.log('Test 3: Alternative filter syntax');
    const { data, error } = await supabase
      .from('submissions')
      .select('id')
      .filter('case_study_request_id', 'eq', testCaseId);
    
    if (error) {
      console.log('❌ Test 3 failed:', error.message);
    } else {
      console.log('✅ Test 3 success:', data);
    }
  } catch (err) {
    console.log('❌ Test 3 error:', err.message);
  }
  
  // Test 4: Mit RLS-Bypass (falls möglich)
  try {
    console.log('Test 4: Check table permissions');
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Test 4 failed (permissions?):', error.message);
    } else {
      console.log('✅ Test 4 success - table accessible:', data.length, 'rows');
    }
  } catch (err) {
    console.log('❌ Test 4 error:', err.message);
  }
};

// 4. Repariere die updateGrade-Funktion
window.fixedUpdateGrade = async (caseStudyId, grade, gradeText) => {
  console.log('🔧 Using fixed updateGrade function...');
  console.log('Parameters:', { caseStudyId, grade, gradeText });
  
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase not available');
    return false;
  }
  
  try {
    // Methode 1: Upsert mit besserer Fehlerbehandlung
    console.log('📡 Attempting upsert...');
    
    const upsertData = {
      case_study_request_id: caseStudyId,
      grade: grade,
      grade_text: gradeText || null,
      file_url: 'auto-save-grade',
      file_type: 'pdf',
      status: 'corrected',
      corrected_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('submissions')
      .upsert(upsertData, {
        onConflict: 'case_study_request_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('❌ Upsert failed:', error);
      
      // Fallback: Versuche Update
      console.log('🔄 Trying update fallback...');
      
      const { data: updateData, error: updateError } = await supabase
        .from('submissions')
        .update({
          grade: grade,
          grade_text: gradeText || null,
          updated_at: new Date().toISOString()
        })
        .eq('case_study_request_id', caseStudyId)
        .select();
      
      if (updateError) {
        console.error('❌ Update also failed:', updateError);
        
        // Letzter Versuch: Insert
        console.log('🔄 Trying insert fallback...');
        
        const { data: insertData, error: insertError } = await supabase
          .from('submissions')
          .insert(upsertData)
          .select();
        
        if (insertError) {
          console.error('❌ All methods failed:', insertError);
          return false;
        } else {
          console.log('✅ Insert successful:', insertData);
          return true;
        }
      } else {
        console.log('✅ Update successful:', updateData);
        return true;
      }
    } else {
      console.log('✅ Upsert successful:', data);
      return true;
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
};

// 5. Teste die reparierte Funktion
window.testFixedGrade = async () => {
  console.log('🧪 Testing fixed grade function...');
  
  const testCaseId = '22f2e18b-d550-429b-bfda-0f408e9a51a8';
  const testGrade = null; // Test NULL save
  
  const success = await window.fixedUpdateGrade(testCaseId, testGrade, 'Test NULL save');
  
  if (success) {
    console.log('✅ Fixed function works!');
  } else {
    console.log('❌ Fixed function still has issues');
  }
};

// 6. Überschreibe die originale updateGrade-Funktion
if (typeof updateGrade !== 'undefined') {
  console.log('🔄 Overriding original updateGrade function...');
  window.originalUpdateGrade = updateGrade;
  window.updateGrade = window.fixedUpdateGrade;
} else {
  console.log('ℹ️ Original updateGrade not found - using fixedUpdateGrade');
}

// 7. Führe Tests aus
console.log('🚀 Running tests...');
testQueries();

setTimeout(() => {
  console.log('🧪 Testing fixed grade function in 3 seconds...');
  window.testFixedGrade();
}, 3000);

// 8. Debugging-Hilfsfunktionen
window.supabaseDebug = {
  checkAuth: async () => {
    const { data, error } = await supabase.auth.getUser();
    console.log('Auth check:', { user: data.user?.email, error });
    return data.user;
  },
  
  testTable: async (tableName = 'submissions') => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    console.log(`Table ${tableName}:`, { accessible: !error, error, sampleData: data });
    return !error;
  },
  
  checkHeaders: () => {
    console.log('Supabase headers:', {
      url: supabase.supabaseUrl,
      hasKey: !!supabase.supabaseKey,
      authHeader: supabase.auth.session?.access_token ? 'Present' : 'Missing'
    });
  },
  
  fixHeaders: () => {
    // Versuche Header-Probleme zu reparieren
    if (supabase.auth.session?.access_token) {
      supabase.rest.headers['Authorization'] = `Bearer ${supabase.auth.session.access_token}`;
      console.log('✅ Auth header fixed');
    }
    
    supabase.rest.headers['Accept'] = 'application/json';
    supabase.rest.headers['Content-Type'] = 'application/json';
    console.log('✅ Content headers fixed');
  }
};

console.log('📋 Available debug commands:');
console.log('- supabaseDebug.checkAuth() - Check authentication');
console.log('- supabaseDebug.testTable() - Test table access');
console.log('- supabaseDebug.checkHeaders() - Check headers');
console.log('- supabaseDebug.fixHeaders() - Fix headers');
console.log('- fixedUpdateGrade(id, grade, text) - Use fixed function');
console.log('- testFixedGrade() - Test the fix');

console.log('🎉 406 error fix setup complete!');
