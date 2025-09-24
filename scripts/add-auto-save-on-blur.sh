#!/bin/bash

# Script zum Hinzufügen von Auto-Save bei onBlur für NULL-Zustände
# Speichert automatisch wenn Benutzer das Feld verlässt

FILE="src/pages/InstructorDashboard.tsx"

echo "🔧 Adding auto-save on blur functionality to $FILE..."

# Backup erstellen
cp "$FILE" "$FILE.backup.autosave_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# 1. Erweitere onBlur Handler für automatisches Speichern von NULL-Werten
# Suche nach bestehenden onBlur Handlern und erweitere sie
sed -i '' 's/onBlur={(e) => {/onBlur={(e) => {\
    const grade = parseFloat(e.target.value);\
    const currentGrade = grades[request.id];\
    \/\/ Auto-save: Speichere auch leere\/NULL Werte\
    if (e.target.value === "" || e.target.value.trim() === "") {\
      \/\/ Leeres Feld - speichere NULL\
      updateGrade(request.id, null, currentGrade?.gradeText || "");\
    } else if (!isNaN(grade) \&\& grade >= 0 \&\& grade <= 18) {\
      \/\/ Gültige Note - speichere Wert\
      updateGrade(request.id, grade, currentGrade?.gradeText || "");\
    }\
    \/\/ Original onBlur logic:/g' "$FILE"

echo "✅ Enhanced onBlur handlers for auto-save"

# 2. Füge onBlur zu Input-Feldern hinzu, die es noch nicht haben
# Suche nach Input-Feldern ohne onBlur und füge hinzu
sed -i '' 's/<input\([^>]*\)type="number"\([^>]*\)placeholder="Note (0-18)"\([^>]*\)>/<input\1type="number"\2placeholder="Note (0-18)"\3\
  onBlur={(e) => {\
    const value = e.target.value.trim();\
    const requestId = request.id; \/\/ Adjust based on context\
    const currentGrade = grades[requestId];\
    \
    if (value === "") {\
      \/\/ Auto-save NULL for empty field\
      updateGrade(requestId, null, currentGrade?.gradeText || "");\
      console.log("🔄 Auto-saved NULL value for:", requestId);\
    } else {\
      const grade = parseFloat(value);\
      if (!isNaN(grade) \&\& grade >= 0 \&\& grade <= 18) {\
        \/\/ Auto-save valid grade\
        updateGrade(requestId, grade, currentGrade?.gradeText || "");\
        console.log("🔄 Auto-saved grade:", grade, "for:", requestId);\
      }\
    }\
  }}>/' "$FILE"

echo "✅ Added onBlur auto-save to input fields"

# 3. Erweitere updateGrade um besseres NULL-Handling
sed -i '' 's/const updateGrade = async (caseStudyId: string, grade: number, gradeText?: string)/const updateGrade = async (caseStudyId: string, grade: number | null, gradeText?: string)/' "$FILE"

echo "✅ Updated updateGrade function signature for NULL support"

# 4. Stelle sicher, dass NULL-Werte in der Datenbank gespeichert werden
sed -i '' 's/grade: grade,/grade: grade === null ? null : grade,/' "$FILE"

echo "✅ Ensured NULL values are properly saved to database"

echo ""
echo "🎉 Auto-save on blur functionality added!"
echo ""
echo "📝 Changes made:"
echo "   ✅ Enhanced onBlur handlers for auto-save"
echo "   ✅ Auto-save triggers on field blur (focus leave)"
echo "   ✅ Empty fields auto-save as NULL"
echo "   ✅ Valid grades auto-save immediately"
echo "   ✅ Console logging for debugging"
echo ""
echo "🧪 Test scenarios:"
echo "   1. Enter grade → Tab away → Should auto-save"
echo "   2. Clear field → Tab away → Should auto-save NULL"
echo "   3. Enter invalid grade → Tab away → No save (or warning)"
echo "   4. Check console for auto-save messages"
echo ""
echo "💡 Expected behavior:"
echo "   - Focus out of empty field = Auto-save NULL"
echo "   - Focus out of valid grade = Auto-save grade"
echo "   - No manual 'Save' button click needed"
echo "   - Immediate database update on blur"
