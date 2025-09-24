#!/bin/bash

# Script zum Erlauben von NULL/leeren Noten als speicherbare Werte
# Ermöglicht das Speichern von leeren Werten um Noten zu "löschen"

FILE="src/pages/InstructorDashboard.tsx"

echo "🔧 Allowing NULL/empty grades to be saved in $FILE..."

# Backup erstellen
cp "$FILE" "$FILE.backup.null_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# 1. Ändere Button-Validierung um leere Werte zu erlauben
# Ersetze die disabled-Logik um auch leere Werte speichern zu können
sed -i '' 's/disabled={grades\[\([^]]*\)\]?\.grade === undefined || grades\[\1\]?\.grade === null || grades\[\1\]?\.grade < 0 || grades\[\1\]?\.grade > 18}/disabled={false}/g' "$FILE"

echo "✅ Removed button validation - all states now saveable"

# 2. Erweitere updateGrade um NULL-Werte zu handhaben
# Suche nach der updateGrade Validierung und ersetze sie
sed -i '' 's/if (grade !== undefined && grade >= 0 && grade <= 18)/if (grade === undefined || grade === null || (grade >= 0 \&\& grade <= 18))/g' "$FILE"

echo "✅ Updated updateGrade to accept NULL values"

# 3. Erweitere die onChange Handler um NULL-Werte korrekt zu behandeln
# Ändere die Grade-Zuweisung
sed -i '' 's/grade: grade,/grade: value === "" ? null : grade,/g' "$FILE"

echo "✅ Updated onChange handlers for NULL handling"

# 4. Erweitere getGradeDescription für NULL-Werte
sed -i '' '/const getGradeDescription = (points: number): string => {/a\
  if (points === null || points === undefined) return "";' "$FILE"

echo "✅ Updated getGradeDescription for NULL values"

echo ""
echo "🎉 NULL grade functionality added!"
echo ""
echo "📝 New behavior:"
echo "   ✅ Empty field can be saved (stores NULL in database)"
echo "   ✅ Button is always enabled"
echo "   ✅ NULL values clear existing grades"
echo "   ✅ Valid grades (0-18) work as before"
echo ""
echo "🧪 Test scenarios:"
echo "   1. Enter grade → Save → Works"
echo "   2. Clear field → Save → Stores NULL (clears grade)"
echo "   3. Enter 0 → Save → Stores 0 (valid grade)"
echo "   4. Enter invalid grade → Save → Should show error"
echo ""
echo "💡 Button text suggestions:"
echo "   - 'Note speichern' → 'Speichern' (more generic)"
echo "   - Add tooltip: 'Leeres Feld löscht die Note'"
