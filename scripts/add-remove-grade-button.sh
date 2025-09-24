#!/bin/bash

# Script zum Hinzufügen eines "Note entfernen" Buttons
# Ermöglicht das Löschen bestehender Noten aus der Datenbank

FILE="src/pages/InstructorDashboard.tsx"

echo "🔧 Adding remove grade functionality to $FILE..."

# Backup erstellen
cp "$FILE" "$FILE.backup.remove_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# 1. Füge Trash2 Icon zu den Imports hinzu (falls nicht vorhanden)
if ! grep -q "Trash2" "$FILE"; then
    sed -i '' 's/} from '\''lucide-react'\'';/, Trash2} from '\''lucide-react'\'';/' "$FILE"
    echo "✅ Added Trash2 import"
fi

# 2. Füge removeGrade Funktion nach updateGrade hinzu
# Suche nach dem Ende der updateGrade Funktion und füge removeGrade hinzu
cat >> temp_remove_function.txt << 'EOF'

  const removeGrade = async (caseStudyId: string) => {
    if (!window.confirm('Möchten Sie die Note wirklich entfernen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    try {
      // Entferne Note aus der Datenbank
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('case_study_request_id', caseStudyId);

      if (error) throw error;

      // Entferne Note aus dem lokalen State
      setGrades(prev => {
        const newGrades = { ...prev };
        delete newGrades[caseStudyId];
        return newGrades;
      });

      // Refresh data
      fetchData();
      alert('Note erfolgreich entfernt!');
    } catch (error) {
      console.error('Error removing grade:', error);
      alert('Fehler beim Entfernen der Note');
    }
  };
EOF

# Finde die Zeile nach updateGrade und füge die Funktion ein
awk '/const updateGrade = async/ {p=1} p && /^  };$/ && !added {print; while((getline line < "temp_remove_function.txt") > 0) print line; close("temp_remove_function.txt"); added=1; next} {print}' "$FILE" > temp_file && mv temp_file "$FILE"

rm -f temp_remove_function.txt
echo "✅ Added removeGrade function"

echo ""
echo "🎉 Remove grade functionality added!"
echo ""
echo "📝 Next steps (manual):"
echo "   1. Add remove buttons to all 4 grade input sections"
echo "   2. Use this pattern for each button:"
echo ""
echo "   {grades[request.id]?.grade !== undefined && ("
echo "     <button"
echo "       onClick={() => removeGrade(request.id)}"
echo "       className=\"px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1 ml-2\""
echo "       title=\"Note entfernen\""
echo "     >"
echo "       <Trash2 className=\"w-4 h-4\" />"
echo "     </button>"
echo "   )}"
echo ""
echo "🧪 Test the functionality:"
echo "   1. Enter and save a grade"
echo "   2. Red trash button should appear"
echo "   3. Click it to remove the grade"
echo "   4. Confirm the deletion"
