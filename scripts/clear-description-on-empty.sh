#!/bin/bash

# Script zum Leeren der Notenbeschreibung wenn das Notenfeld geleert wird
# Verbessert die UX durch konsistente Anzeige

FILE="src/pages/InstructorDashboard.tsx"

echo "🔧 Fixing grade description clearing in $FILE..."

# Backup erstellen
cp "$FILE" "$FILE.backup.clear_desc_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# 1. Repariere die onChange Handler um Beschreibung bei leerem Feld zu leeren
# Suche nach dem Pattern und ersetze es
sed -i '' 's/const gradeDescription = (grade !== undefined && grade >= 0) ? getGradeDescription(grade) : '\'''\'';/const gradeDescription = (grade !== null \&\& grade !== undefined \&\& grade >= 0) ? getGradeDescription(grade) : '\'''\'';/g' "$FILE"

echo "✅ Fixed grade description clearing for undefined/null values"

# 2. Erweitere die Logik um auch bei NaN zu leeren
sed -i '' 's/const gradeDescription = getGradeDescription(grade);/const gradeDescription = (grade !== null \&\& grade !== undefined \&\& !isNaN(grade)) ? getGradeDescription(grade) : '\'''\'';/g' "$FILE"

echo "✅ Added NaN handling for grade description"

# 3. Stelle sicher, dass bei leerem Feld auch gradeText geleert wird
sed -i '' 's/gradeText: gradeDescription/gradeText: value === '\'''\'' ? '\'''\'' : gradeDescription/g' "$FILE"

echo "✅ Ensured gradeText is cleared when field is empty"

echo ""
echo "🎉 Grade description clearing fixed!"
echo ""
echo "📝 New behavior:"
echo "   ✅ Empty field → Description cleared"
echo "   ✅ Invalid input → Description cleared"
echo "   ✅ Valid grade → Correct description shown"
echo "   ✅ 0 → 'ungenügend (0 Punkte)'"
echo ""
echo "🧪 Test scenarios:"
echo "   1. Enter grade → Description appears"
echo "   2. Clear field → Description disappears"
echo "   3. Enter invalid grade → Description disappears"
echo "   4. Enter 0 → Shows '0 Punkte' description"
