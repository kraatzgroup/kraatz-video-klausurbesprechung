#!/bin/bash

# Script zum automatischen Update der Noteneingabe in InstructorDashboard.tsx
# Ermöglicht 0 als Note und fügt Entfernen-Funktionalität hinzu

FILE="src/pages/InstructorDashboard.tsx"

echo "🔧 Updating grade input functionality in $FILE..."

# 1. Backup erstellen
cp "$FILE" "$FILE.backup"
echo "✅ Backup created: $FILE.backup"

# 2. Erweitere Lucide-React Imports um Trash2
sed -i '' 's/Table$/Table,\
  Trash2/' "$FILE"
echo "✅ Added Trash2 import"

# 3. Erweitere getGradeDescription Funktion für 0 Punkte
sed -i '' 's/if (points >= 0 && points <= 1\.49) return '\''ungenügend'\'';/if (points === 0) return '\''ungenügend (0 Punkte)'\'';\'$'\n''    if (points > 0 \&\& points <= 1.49) return '\''ungenügend'\'';/' "$FILE"
echo "✅ Updated getGradeDescription for 0 points"

# 4. Füge removeGrade Funktion nach updateGrade hinzu
# (Dies ist komplex mit sed, daher nur ein Platzhalter)
echo "⚠️  Manual step required: Add removeGrade function after updateGrade"

# 5. Update Button-Validierung (vereinfacht)
sed -i '' 's/!grades\[\([^]]*\)\]?\.grade/grades[\1]?.grade === undefined || grades[\1]?.grade === null/g' "$FILE"
echo "✅ Updated button validation"

# 6. Update onChange Handler (vereinfacht)
sed -i '' 's/const grade = value ? parseFloat(value) : 0;/const grade = value === '\'''\'' ? undefined : parseFloat(value);/' "$FILE"
echo "✅ Updated onChange handlers"

echo ""
echo "🎉 Automated updates completed!"
echo ""
echo "📝 Manual steps still required:"
echo "   1. Add removeGrade function (see GRADE_INPUT_INSTRUCTIONS.md)"
echo "   2. Add remove buttons to all 4 tabs"
echo "   3. Update onChange logic for grade description"
echo "   4. Test all functionality"
echo ""
echo "📖 See GRADE_INPUT_INSTRUCTIONS.md for detailed manual steps"
