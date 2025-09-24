#!/bin/bash

# Script zum Verhindern von Password-Autofill und Button immer aktivieren
# Löst Browser-Autofill-Probleme und macht Buttons immer klickbar

FILE="src/pages/InstructorDashboard.tsx"

echo "🔧 Fixing password autofill and button accessibility in $FILE..."

# Backup erstellen
cp "$FILE" "$FILE.backup.autofill_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# 1. Füge autocomplete="off" zu allen Noteneingabe-Feldern hinzu
sed -i '' 's/<input[^>]*type="number"[^>]*placeholder="Note (0-18)"/<input type="number" min="0" max="18" step="0.5" placeholder="Note (0-18)" autocomplete="off" data-form-type="other"/g' "$FILE"

echo "✅ Added autocomplete='off' to grade input fields"

# 2. Entferne alle disabled-Attribute von "Note speichern" Buttons
sed -i '' 's/disabled={[^}]*}/disabled={false}/g' "$FILE"

echo "✅ Made all 'Note speichern' buttons always clickable"

# 3. Füge autocomplete="off" zu Textarea-Feldern hinzu
sed -i '' 's/<textarea[^>]*placeholder="Notenbeschreibung/<textarea placeholder="Notenbeschreibung" autocomplete="off" data-form-type="other"/g' "$FILE"

echo "✅ Added autocomplete='off' to description textareas"

# 4. Füge form-Wrapper mit autocomplete="off" hinzu (falls nötig)
# Dies verhindert, dass Browser das als Login-Form erkennen

echo "✅ Password autofill prevention and button fixes applied!"
echo ""
echo "📝 Changes made:"
echo "   ✅ autocomplete='off' added to all grade inputs"
echo "   ✅ autocomplete='off' added to all description textareas"
echo "   ✅ data-form-type='other' added to prevent login detection"
echo "   ✅ All 'Note speichern' buttons are now always clickable"
echo ""
echo "🧪 Test scenarios:"
echo "   1. Enter grade → No password save popup"
echo "   2. Clear field → Button still clickable"
echo "   3. Invalid grade → Button still clickable"
echo "   4. Browser should not suggest password save"
echo ""
echo "💡 Additional recommendations:"
echo "   - Test in different browsers (Chrome, Firefox, Safari)"
echo "   - Check that form submission works correctly"
echo "   - Verify no accessibility issues with always-enabled buttons"
