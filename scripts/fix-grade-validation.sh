#!/bin/bash

# Script zum Reparieren der Notenvalidierung in InstructorDashboard.tsx
# Ermöglicht 0 als gültige Note und bessere Validierung

FILE="src/pages/InstructorDashboard.tsx"

echo "🔧 Fixing grade validation in $FILE..."

# Backup erstellen
cp "$FILE" "$FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# 1. Repariere die Button-Validierung für 0 als gültige Note
# Ersetze alle Vorkommen der alten Validierung
sed -i '' 's/disabled={!grades\[\([^]]*\)\]?\.grade || grades\[\1\]?\.grade < 0 || grades\[\1\]?\.grade > 18}/disabled={grades[\1]?.grade === undefined || grades[\1]?.grade === null || grades[\1]?.grade < 0 || grades[\1]?.grade > 18}/g' "$FILE"

echo "✅ Fixed button validation for 0 points"

# 2. Repariere die onChange Handler für bessere 0-Behandlung
# Suche nach dem Pattern und ersetze es
sed -i '' 's/const grade = value ? parseFloat(value) : 0;/const grade = value === "" ? undefined : parseFloat(value);/g' "$FILE"

echo "✅ Fixed onChange handlers"

# 3. Repariere die getGradeDescription Funktion für 0 Punkte
sed -i '' 's/if (points >= 0 && points <= 1\.49) return '\''ungenügend'\'';/if (points === 0) return '\''ungenügend (0 Punkte)'\'';\'$'\n''    if (points > 0 \&\& points <= 1.49) return '\''ungenügend'\'';/g' "$FILE"

echo "✅ Fixed grade description for 0 points"

# 4. Repariere die updateGrade Validierung
sed -i '' 's/if (grade >= 0 && grade <= 18)/if (grade !== undefined \&\& grade >= 0 \&\& grade <= 18)/g' "$FILE"

echo "✅ Fixed updateGrade validation"

echo ""
echo "🎉 Grade validation fixes completed!"
echo ""
echo "📝 Changes made:"
echo "   ✅ 0 is now a valid grade"
echo "   ✅ Button validation fixed"
echo "   ✅ onChange handlers improved"
echo "   ✅ Grade description updated"
echo ""
echo "🧪 Test these scenarios:"
echo "   1. Enter 0 - should enable button and show 'ungenügend (0 Punkte)'"
echo "   2. Clear input - should disable button"
echo "   3. Enter valid grade (1-18) - should enable button"
echo "   4. Save and remove grades - should work properly"
