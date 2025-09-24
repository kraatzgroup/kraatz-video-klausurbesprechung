#!/bin/bash

# Script zum Reparieren der mehrfachen Supabase-Instanzen
# Erstellt eine zentrale Singleton-Instanz

echo "🔧 Fixing multiple Supabase instances..."

# Backup erstellen
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 1. Erstelle zentrale Supabase-Instanz
echo "📦 Creating singleton Supabase instance..."

cat > src/lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

// Singleton-Pattern für einzige Supabase-Instanz
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    console.log('🔧 Creating new Supabase instance...')
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'kraatz-club-auth-singleton'
      },
      global: {
        headers: {
          'X-Client-Info': 'kraatz-club-singleton'
        }
      }
    })
  } else {
    console.log('♻️ Reusing existing Supabase instance')
  }
  return supabaseInstance
})()

// Verhindere mehrfache Instanzen
export default supabase

// Debug-Funktion
export const getSupabaseInstanceInfo = () => ({
  url: supabaseUrl,
  hasInstance: !!supabaseInstance,
  instanceId: supabaseInstance ? 'singleton' : 'none'
})
EOF

echo "✅ Created singleton Supabase instance"

# 2. Repariere alle Komponenten-Imports
echo "🔄 Fixing component imports..."

# AdminUserManagement.tsx
if [ -f "src/pages/AdminUserManagement.tsx" ]; then
  cp "src/pages/AdminUserManagement.tsx" "src/pages/AdminUserManagement.tsx.backup.$TIMESTAMP"
  sed -i '' 's/import { createClient } from.*$/import { supabase } from "..\/lib\/supabase";/' "src/pages/AdminUserManagement.tsx"
  sed -i '' 's/const supabase = createClient.*/\/\/ Using singleton supabase instance/' "src/pages/AdminUserManagement.tsx"
  echo "✅ Fixed AdminUserManagement.tsx"
fi

# AdminCasesOverview.tsx
if [ -f "src/components/AdminCasesOverview.tsx" ]; then
  cp "src/components/AdminCasesOverview.tsx" "src/components/AdminCasesOverview.tsx.backup.$TIMESTAMP"
  sed -i '' 's/import { createClient } from.*$/import { supabase } from "..\/lib\/supabase";/' "src/components/AdminCasesOverview.tsx"
  sed -i '' 's/const supabase = createClient.*/\/\/ Using singleton supabase instance/' "src/components/AdminCasesOverview.tsx"
  echo "✅ Fixed AdminCasesOverview.tsx"
fi

# AdminActivityDashboard.tsx
if [ -f "src/components/AdminActivityDashboard.tsx" ]; then
  cp "src/components/AdminActivityDashboard.tsx" "src/components/AdminActivityDashboard.tsx.backup.$TIMESTAMP"
  sed -i '' 's/import { createClient } from.*$/import { supabase } from "..\/lib\/supabase";/' "src/components/AdminActivityDashboard.tsx"
  sed -i '' 's/const supabase = createClient.*/\/\/ Using singleton supabase instance/' "src/components/AdminActivityDashboard.tsx"
  echo "✅ Fixed AdminActivityDashboard.tsx"
fi

# AdminDashboard.tsx
if [ -f "src/pages/AdminDashboard.tsx" ]; then
  cp "src/pages/AdminDashboard.tsx" "src/pages/AdminDashboard.tsx.backup.$TIMESTAMP"
  sed -i '' 's/import { createClient } from.*$/import { supabase } from "..\/lib\/supabase";/' "src/pages/AdminDashboard.tsx"
  sed -i '' 's/const supabase = createClient.*/\/\/ Using singleton supabase instance/' "src/pages/AdminDashboard.tsx"
  echo "✅ Fixed AdminDashboard.tsx"
fi

# SettingsPage.tsx
if [ -f "src/pages/SettingsPage.tsx" ]; then
  cp "src/pages/SettingsPage.tsx" "src/pages/SettingsPage.tsx.backup.$TIMESTAMP"
  sed -i '' 's/import { createClient } from.*$/import { supabase } from "..\/lib\/supabase";/' "src/pages/SettingsPage.tsx"
  sed -i '' 's/const supabase = createClient.*/\/\/ Using singleton supabase instance/' "src/pages/SettingsPage.tsx"
  echo "✅ Fixed SettingsPage.tsx"
fi

# adminUtils.ts
if [ -f "src/utils/adminUtils.ts" ]; then
  cp "src/utils/adminUtils.ts" "src/utils/adminUtils.ts.backup.$TIMESTAMP"
  sed -i '' 's/import { createClient } from.*$/import { supabase } from "..\/lib\/supabase";/' "src/utils/adminUtils.ts"
  sed -i '' 's/const supabase = createClient.*/\/\/ Using singleton supabase instance/' "src/utils/adminUtils.ts"
  echo "✅ Fixed adminUtils.ts"
fi

# InstructorDashboard.tsx
if [ -f "src/pages/InstructorDashboard.tsx" ]; then
  cp "src/pages/InstructorDashboard.tsx" "src/pages/InstructorDashboard.tsx.backup.$TIMESTAMP"
  sed -i '' 's/import { createClient } from.*$/import { supabase } from "..\/lib\/supabase";/' "src/pages/InstructorDashboard.tsx"
  sed -i '' 's/const supabase = createClient.*/\/\/ Using singleton supabase instance/' "src/pages/InstructorDashboard.tsx"
  echo "✅ Fixed InstructorDashboard.tsx"
fi

# 3. Finde und repariere alle anderen Dateien
echo "🔍 Scanning for other Supabase instances..."
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "createClient" | while read file; do
  if [[ "$file" != "src/lib/supabase.ts" ]]; then
    echo "🔄 Fixing $file..."
    cp "$file" "$file.backup.$TIMESTAMP"
    sed -i '' 's/import { createClient } from.*$/import { supabase } from "..\/lib\/supabase";/' "$file"
    sed -i '' 's/const supabase = createClient.*/\/\/ Using singleton supabase instance/' "$file"
  fi
done

echo ""
echo "🎉 Multiple Supabase instances fix completed!"
echo ""
echo "📝 Changes made:"
echo "   ✅ Created singleton Supabase instance in src/lib/supabase.ts"
echo "   ✅ Fixed all component imports to use singleton"
echo "   ✅ Removed duplicate createClient calls"
echo "   ✅ Added unique storage key to prevent conflicts"
echo ""
echo "🔄 IMPORTANT: Restart development server!"
echo "   npm start"
echo ""
echo "🧪 After restart, check console for:"
echo "   - No more 'Multiple GoTrueClient instances' warnings"
echo "   - No more 406 (Not Acceptable) errors"
echo "   - Single 'Creating new Supabase instance' message"
echo ""
echo "💾 Backups created with timestamp: $TIMESTAMP"
