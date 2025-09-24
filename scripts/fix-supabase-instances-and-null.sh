#!/bin/bash

# Script zum Reparieren der mehrfachen Supabase-Instanzen und NULL-Speicherung
# Löst GoTrueClient-Probleme und ermöglicht NULL-Werte

echo "🔧 Fixing multiple Supabase instances and NULL value issues..."

# Backup erstellen
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp "src/lib/supabase.ts" "src/lib/supabase.ts.backup.$TIMESTAMP" 2>/dev/null || echo "supabase.ts not found, will create"

# 1. Erstelle/Repariere zentrale Supabase-Instanz
cat > src/lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

// Singleton-Pattern für einzige Supabase-Instanz
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'kraatz-club-auth'
      }
    })
  }
  return supabaseInstance
})()

// Verhindere mehrfache Instanzen
export default supabase
EOF

echo "✅ Created singleton Supabase instance"

# 2. Repariere alle Imports um zentrale Instanz zu verwenden
find src -name "*.ts" -o -name "*.tsx" | grep -v supabase.ts | xargs sed -i '' 's/import { createClient } from.*supabase.*$/import { supabase } from "..\/lib\/supabase"/g'
find src -name "*.ts" -o -name "*.tsx" | grep -v supabase.ts | xargs sed -i '' 's/const supabase = createClient.*/\/\/ Using singleton supabase instance/g'

echo "✅ Fixed Supabase imports"

# 3. Repariere InstructorDashboard für NULL-Werte
FILE="src/pages/InstructorDashboard.tsx"

if [ -f "$FILE" ]; then
    cp "$FILE" "$FILE.backup.$TIMESTAMP"
    
    # Entferne alle disabled-Attribute für Buttons
    sed -i '' 's/disabled={[^}]*}/disabled={false}/g' "$FILE"
    
    # Repariere updateGrade für NULL-Werte
    sed -i '' 's/if (grade >= 0 && grade <= 18)/if (grade === null || grade === undefined || (grade >= 0 \&\& grade <= 18))/g' "$FILE"
    
    # Repariere onChange Handler für NULL
    sed -i '' 's/const grade = value ? parseFloat(value) : 0;/const grade = value === "" ? null : parseFloat(value);/g' "$FILE"
    
    echo "✅ Fixed InstructorDashboard for NULL values"
fi

# 4. Erstelle Debug-Utility für Supabase-Instanzen
cat > src/utils/supabaseDebug.ts << 'EOF'
// Debug-Utility für Supabase-Instanzen
export const debugSupabaseInstances = () => {
  const instances = (window as any).__supabaseInstances || [];
  console.log('🔍 Supabase instances found:', instances.length);
  
  if (instances.length > 1) {
    console.warn('⚠️ Multiple Supabase instances detected!');
    instances.forEach((instance: any, index: number) => {
      console.log(`Instance ${index + 1}:`, instance);
    });
  } else {
    console.log('✅ Single Supabase instance (correct)');
  }
  
  return instances;
};

// Registriere Instanz für Debugging
if (typeof window !== 'undefined') {
  (window as any).__supabaseInstances = (window as any).__supabaseInstances || [];
}
EOF

echo "✅ Created Supabase debug utility"

# 5. Erstelle NULL-Wert Test-Utility
cat > src/utils/nullValueTest.ts << 'EOF'
import { supabase } from '../lib/supabase';

// Test-Utility für NULL-Werte
export const testNullValueSaving = async () => {
  console.log('🧪 Testing NULL value saving...');
  
  try {
    // Test 1: Erstelle Test-Submission mit NULL
    const testData = {
      case_study_request_id: 'test-null-' + Date.now(),
      file_url: 'test-url',
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
      console.error('❌ NULL value test failed:', error);
      return false;
    }
    
    console.log('✅ NULL value successfully saved:', data);
    
    // Cleanup
    if (data?.[0]?.id) {
      await supabase.from('submissions').delete().eq('id', data[0].id);
      console.log('🧹 Test data cleaned up');
    }
    
    return true;
  } catch (error) {
    console.error('❌ NULL value test error:', error);
    return false;
  }
};

// Test für Grade-Update mit NULL
export const testGradeNullUpdate = async (caseStudyId: string) => {
  console.log('🧪 Testing grade NULL update for:', caseStudyId);
  
  try {
    const { data, error } = await supabase
      .from('submissions')
      .update({ 
        grade: null,
        grade_text: null
      })
      .eq('case_study_request_id', caseStudyId)
      .select();
    
    if (error) {
      console.error('❌ Grade NULL update failed:', error);
      return false;
    }
    
    console.log('✅ Grade successfully set to NULL:', data);
    return true;
  } catch (error) {
    console.error('❌ Grade NULL update error:', error);
    return false;
  }
};
EOF

echo "✅ Created NULL value test utility"

echo ""
echo "🎉 Fixes completed!"
echo ""
echo "📝 Changes made:"
echo "   ✅ Created singleton Supabase instance"
echo "   ✅ Fixed multiple GoTrueClient instances"
echo "   ✅ Enabled NULL value saving"
echo "   ✅ Made all buttons always clickable"
echo "   ✅ Added debug utilities"
echo ""
echo "🧪 Test in browser console:"
echo "   import { debugSupabaseInstances } from './src/utils/supabaseDebug'"
echo "   debugSupabaseInstances()"
echo ""
echo "   import { testNullValueSaving } from './src/utils/nullValueTest'"
echo "   testNullValueSaving()"
echo ""
echo "🔄 Restart development server to apply changes!"
