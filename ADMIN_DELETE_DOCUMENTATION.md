# Admin-Löschfunktion für Klausuren

## 🎯 Übersicht

Die Admin-Löschfunktion ermöglicht es Administratoren, Klausuren vollständig aus dem System zu entfernen. Dies umfasst alle zugehörigen Daten und Dateien, sodass die Klausur sowohl für Studenten als auch für Dozenten nicht mehr sichtbar ist.

## 🔧 Technische Implementierung

### 1. PostgreSQL-Funktion: `admin_delete_case_study`

**Erstellt durch:** `/scripts/create-admin-delete-function.js`

```sql
CREATE OR REPLACE FUNCTION admin_delete_case_study(case_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  deleted_submissions INTEGER := 0;
  deleted_ratings INTEGER := 0;
  deleted_notifications INTEGER := 0;
  case_exists BOOLEAN := FALSE;
BEGIN
  -- Check if case exists
  SELECT EXISTS(SELECT 1 FROM case_study_requests WHERE id = case_id) INTO case_exists;
  
  IF NOT case_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Case study not found'
    );
  END IF;
  
  -- Delete related submissions
  DELETE FROM submissions WHERE case_study_request_id = case_id;
  GET DIAGNOSTICS deleted_submissions = ROW_COUNT;
  
  -- Delete related ratings (using correct column name)
  DELETE FROM case_study_ratings WHERE case_study_id = case_id;
  GET DIAGNOSTICS deleted_ratings = ROW_COUNT;
  
  -- Delete related notifications
  DELETE FROM notifications WHERE related_case_study_id = case_id::text;
  GET DIAGNOSTICS deleted_notifications = ROW_COUNT;
  
  -- Delete the main case study request
  DELETE FROM case_study_requests WHERE id = case_id;
  
  -- Return success with details
  RETURN json_build_object(
    'success', true,
    'deleted_submissions', deleted_submissions,
    'deleted_ratings', deleted_ratings,
    'deleted_notifications', deleted_notifications,
    'message', 'Case study and all related data deleted successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql;
```

### 2. Frontend-Integration

**Datei:** `/src/components/AdminCasesOverview.tsx`

Die `handleDeleteCase` Funktion:
- Zeigt detaillierte Bestätigungsmeldung
- Löscht Dateien aus Supabase Storage
- Ruft PostgreSQL-Funktion auf
- Zeigt Erfolgsmeldung mit Details

### 3. TypeScript-Typisierung

**Datei:** `/src/types/database.ts`

```typescript
admin_delete_case_study: {
  Args: {
    case_id: string
  }
  Returns: {
    success: boolean
    deleted_submissions: number
    deleted_ratings: number
    deleted_notifications: number
    message?: string
    error?: string
    error_code?: string
  }
}
```

## 📊 Was wird gelöscht?

### Datenbank-Tabellen:
1. **`submissions`** - Alle Abgaben zur Klausur
2. **`case_study_ratings`** - Alle Bewertungen der Klausur
3. **`notifications`** - Alle Benachrichtigungen zur Klausur
4. **`case_study_requests`** - Der Haupteintrag der Klausur

### Supabase Storage:
1. **Studentenabgaben** (`submission_url`)
2. **Video-Korrekturen** (`video_correction_url`)
3. **Schriftliche Korrekturen** (`written_correction_url`)
4. **Musterlösungen** (`solution_pdf_url`)
5. **Zusatzmaterialien** (`additional_materials_url`)
6. **Klausur-Materialien** (`case_study_material_url`)

## 🔒 Sicherheitsmaßnahmen

### 1. Bestätigungsdialog
```javascript
const confirmMessage = `Sind Sie sicher, dass Sie den Auftrag von ${studentName} vollständig löschen möchten?

Dies wird:
✅ Den Auftrag komplett aus der Datenbank entfernen
✅ Alle Bewertungen und Noten löschen
✅ Alle Benachrichtigungen entfernen
✅ Alle zugehörigen Dateien löschen
✅ Den Auftrag aus Student- und Dozenten-Statistiken entfernen

⚠️ Diese Aktion kann NICHT rückgängig gemacht werden!`
```

### 2. Nur für Admins
- Funktion ist nur im Admin-Interface verfügbar
- Erfordert Admin-Berechtigung
- Verwendet Admin-Client für Datenbankoperationen

### 3. Fehlerbehandlung
- Graceful Handling von nicht-existierenden Klausuren
- Detaillierte Fehlermeldungen
- Fortsetzung auch bei Storage-Fehlern

## 📈 Auswirkungen auf Statistiken

### Student-Dashboard:
- **Gesamtanzahl Klausuren** wird reduziert
- **Abgeschlossene Klausuren** werden reduziert
- **Ergebnisstatistiken** werden automatisch aktualisiert
- **Klausur verschwindet** aus allen Listen

### Dozenten-Dashboard:
- **Zugewiesene Klausuren** werden reduziert
- **Korrigierte Klausuren** werden reduziert
- **Arbeitsstatistiken** werden automatisch aktualisiert

### Admin-Dashboard:
- **Gesamtstatistiken** werden automatisch aktualisiert
- **Benutzerstatistiken** werden neu berechnet

## 🧪 Testing

**Test-Script:** `/scripts/test-admin-delete.js`

### Getestete Szenarien:
1. ✅ Nicht-existierende Klausuren
2. ✅ Korrekte Rückgabewerte
3. ✅ Referentielle Integrität
4. ✅ Statistik-Updates

### Test-Ergebnisse:
```
✅ Function correctly handles non-existent cases
✅ Returns detailed deletion results
✅ Maintains referential integrity
✅ Updates student statistics automatically
```

## 🚀 Verwendung

### Im Admin-Interface:
1. Navigiere zu **Admin** → **Klausuren-Übersicht**
2. Finde die zu löschende Klausur
3. Klicke auf den **Löschen-Button** (🗑️)
4. Bestätige die Löschung im Dialog
5. Warte auf Erfolgsmeldung mit Details

### Programmatisch:
```sql
SELECT admin_delete_case_study('case-id-here'::UUID);
```

## ⚠️ Wichtige Hinweise

1. **Irreversibel:** Gelöschte Klausuren können nicht wiederhergestellt werden
2. **Vollständig:** Alle zugehörigen Daten werden entfernt
3. **Sofort:** Änderungen sind sofort für alle Benutzer sichtbar
4. **Statistiken:** Alle Statistiken werden automatisch aktualisiert
5. **Dateien:** Auch alle Dateien werden aus dem Storage gelöscht

## 📝 Logging

Die Funktion protokolliert alle Aktionen:
- 🗑️ Start der Löschung
- 📄 Abruf der Klausurdaten
- 🗂️ Löschung einzelner Dateien
- 🗄️ Aufruf der PostgreSQL-Funktion
- 📊 Ergebnisse der Löschung
- ✅ Erfolgreicher Abschluss

## 🔄 Wartung

### Regelmäßige Überprüfungen:
1. **Orphaned Files:** Prüfung auf verwaiste Dateien im Storage
2. **Referentielle Integrität:** Validierung der Datenbankbeziehungen
3. **Statistik-Konsistenz:** Überprüfung der Benutzerstatistiken

### Backup-Empfehlungen:
- Vor größeren Löschaktionen Backup erstellen
- Regelmäßige Datenbank-Snapshots
- Storage-Backup für wichtige Dateien

---

**Erstellt:** 25.09.2025  
**Version:** 1.0  
**Status:** ✅ Produktionsbereit
