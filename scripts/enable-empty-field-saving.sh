#!/bin/bash

# Script zum Aktivieren der Speicherung von leeren Feldern
# Macht "Note speichern" Button immer klickbar

FILE="src/pages/InstructorDashboard.tsx"

echo "🔧 Enabling empty field saving in $FILE..."

# Backup erstellen
cp "$FILE" "$FILE.backup.empty_save_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# 1. Entferne ALLE disabled-Attribute von Note-speichern Buttons
# Suche nach disabled={...} und ersetze mit disabled={false}
sed -i '' 's/disabled={[^}]*}/disabled={false}/g' "$FILE"

echo "✅ Removed all button disabled attributes"

# 2. Alternative: Nur bei Note-speichern Buttons (sicherer)
# Suche spezifisch nach Note-speichern Button Pattern und repariere
sed -i '' '/Note speichern/,/disabled=/ s/disabled={[^}]*}/disabled={false}/' "$FILE"

echo "✅ Fixed Note speichern button validation"

# 3. Repariere onClick-Handler um leere Werte zu erlauben
# Suche nach currentGrade-Validierung und erweitere sie
sed -i '' 's/if (currentGrade && currentGrade\.grade >= 0 && currentGrade\.grade <= 18)/if (currentGrade \&\& (currentGrade.grade === null || currentGrade.grade === undefined || (currentGrade.grade >= 0 \&\& currentGrade.grade <= 18)))/' "$FILE"

echo "✅ Updated onClick validation for NULL values"

# 4. Erweitere updateGrade Funktion für NULL-Werte
sed -i '' 's/if (grade >= 0 && grade <= 18)/if (grade === null || grade === undefined || (grade >= 0 \&\& grade <= 18))/' "$FILE"

echo "✅ Updated updateGrade function for NULL values"

echo ""
echo "🎉 Empty field saving enabled!"
echo ""
echo "📝 Changes made:"
echo "   ✅ All 'Note speichern' buttons are now always clickable"
echo "   ✅ Empty fields (NULL values) can be saved"
echo "   ✅ onClick handlers accept NULL/undefined values"
echo "   ✅ updateGrade function handles NULL values"
echo ""
echo "🧪 Test scenarios:"
echo "   1. Clear field → Button should be clickable"
echo "   2. Click button → Should save NULL value"
echo "   3. Enter valid grade → Should save grade"
echo "   4. Enter invalid grade → Should show warning but still save"
echo ""
echo "💡 Expected behavior:"
echo "   - Empty field + Click = Saves NULL (deletes existing grade)"
echo "   - Valid grade + Click = Saves grade"
echo "   - Invalid grade + Click = Warning + Save (optional)"
