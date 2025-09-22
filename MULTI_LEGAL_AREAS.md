# 🏛️ Multi-Legal-Area System

## Übersicht
Das System wurde erweitert, um Dozenten und Springern die Verwaltung mehrerer Rechtsgebiete zu ermöglichen. Ein Dozent kann jetzt z.B. sowohl Zivilrecht als auch Öffentliches Recht betreuen, oder ein Springer kann alle drei Gebiete abdecken.

## 🔄 Implementierte Änderungen

### 1. Datenbank-Schema
```sql
-- Neue Spalte für mehrere Rechtsgebiete
ALTER TABLE users ADD COLUMN legal_areas TEXT[] DEFAULT NULL;

-- Aktualisierte Constraints
ALTER TABLE users ADD CONSTRAINT users_legal_areas_check 
CHECK (
  (role IN ('student', 'admin') AND legal_areas IS NULL) OR
  (role IN ('instructor', 'springer') AND legal_areas IS NOT NULL AND 
   array_length(legal_areas, 1) > 0 AND
   legal_areas <@ ARRAY['Zivilrecht', 'Strafrecht', 'Öffentliches Recht']::TEXT[])
);
```

**Migration:**
- Bestehende `instructor_legal_area` Daten wurden zu `legal_areas` Arrays migriert
- Legacy-Feld bleibt für Kompatibilität erhalten
- Neue Benutzer verwenden das Array-System

### 2. TypeScript-Interfaces

**Erweiterte User-Interfaces:**
```typescript
interface UserProfile {
  // ... existing fields
  instructor_legal_area?: string // Legacy field
  legal_areas?: string[] // New multi-area field
}

interface CreateUserData {
  // ... existing fields
  instructorLegalArea?: LegalArea // Legacy - single area
  legalAreas?: LegalArea[] // New - multiple areas
}
```

**Neue Utility-Funktionen:**
```typescript
// legalAreaUtils.ts
getUserLegalAreas(user): LegalArea[] // Get areas from user (legacy + new)
formatLegalAreasDisplay(areas, role): string // Format for display
hasAccessToLegalArea(user, area): boolean // Check access
filterUsersByLegalArea(users, area): User[] // Filter users by area
```

### 3. Admin-Interface

**Multi-Select Komponente:**
- `LegalAreaMultiSelect.tsx`: Neue Komponente für Mehrfachauswahl
- Checkbox-Interface mit "Alle auswählen/abwählen" Funktionen
- Visuelle Anzeige der ausgewählten Gebiete
- Validierung (mindestens ein Gebiet erforderlich)

**Erweiterte Modals:**
- **Benutzer erstellen**: Multi-Select für Rechtsgebiete
- **Rolle ändern**: Multi-Select für bestehende Benutzer
- **Anzeige**: Intelligente Formatierung (z.B. "Dozent (Alle Gebiete)")

### 4. Benachrichtigungslogik

**Erweiterte Abfragen:**
```sql
-- Unterstützt sowohl Legacy- als auch Array-Format
SELECT * FROM users 
WHERE role = 'instructor' 
AND email_notifications_enabled = true
AND (
  instructor_legal_area = 'Zivilrecht' OR 
  legal_areas @> ARRAY['Zivilrecht']
);
```

**Intelligente Weiterleitung:**
- Dozenten mit mehreren Gebieten erhalten Benachrichtigungen für alle ihre Gebiete
- Springer mit allen Gebieten fungieren als universelle Vertretung
- Fallback-Logik berücksichtigt Array-basierte Zuordnungen

## 🎯 Anwendungsbeispiele

### Beispiel 1: Universeller Springer
```typescript
// Springer für alle Rechtsgebiete erstellen
const springerData = {
  email: 'universal-springer@kraatz-club.de',
  role: 'springer',
  legalAreas: ['Zivilrecht', 'Strafrecht', 'Öffentliches Recht']
}
```

**Ergebnis:**
- Erhält Benachrichtigungen für alle drei Rechtsgebiete
- Anzeige: "Springer (Alle Gebiete)"
- Fungiert als Backup für alle Dozenten

### Beispiel 2: Multi-Bereich Dozent
```typescript
// Dozent für zwei Rechtsgebiete
const instructorData = {
  email: 'multi-dozent@kraatz-club.de',
  role: 'instructor',
  legalAreas: ['Zivilrecht', 'Öffentliches Recht']
}
```

**Ergebnis:**
- Sieht Klausuren aus beiden Rechtsgebieten
- Erhält Benachrichtigungen für beide Gebiete
- Anzeige: "Dozent (Zivilrecht, Öffentliches Recht)"

### Beispiel 3: Spezialisierter Springer
```typescript
// Springer nur für Strafrecht
const specialistData = {
  email: 'straf-springer@kraatz-club.de',
  role: 'springer',
  legalAreas: ['Strafrecht']
}
```

**Ergebnis:**
- Erhält nur Strafrecht-Benachrichtigungen
- Anzeige: "Springer Strafrecht"
- Spezialisierte Vertretung

## 🔧 Verwaltung

### Admin-Dashboard Features:
1. **Multi-Select Interface**: Intuitive Auswahl mehrerer Rechtsgebiete
2. **Intelligente Anzeige**: Automatische Formatierung basierend auf Anzahl der Gebiete
3. **Validierung**: Mindestens ein Gebiet für Dozenten/Springer erforderlich
4. **Migration**: Automatische Konvertierung bestehender Daten

### Benachrichtigungs-Routing:
1. **Primär**: Aktive Dozenten des Rechtsgebiets
2. **Fallback**: Springer mit entsprechendem Rechtsgebiet
3. **Universal**: Springer mit allen Rechtsgebieten als letzte Option

## 🔄 Migration und Kompatibilität

### Rückwärtskompatibilität:
- Legacy `instructor_legal_area` Feld bleibt erhalten
- Bestehende Abfragen funktionieren weiterhin
- Schrittweise Migration möglich

### Datenintegrität:
- Automatische Synchronisation zwischen Legacy- und Array-Feldern
- Constraints verhindern inkonsistente Daten
- Validierung auf Frontend- und Backend-Ebene

## 🚀 Nächste Schritte

### Sofort verfügbar:
1. **Multi-Area Benutzer erstellen** über Admin-Interface
2. **Bestehende Benutzer erweitern** mit zusätzlichen Rechtsgebieten
3. **Universelle Springer** für vollständige Abdeckung einrichten

### Empfohlene Konfiguration:
```
Zivilrecht:
- 1 Hauptdozent
- 1 spezialisierter Springer

Strafrecht:
- 1 Hauptdozent  
- 1 spezialisierter Springer

Öffentliches Recht:
- 1 Hauptdozent
- 1 spezialisierter Springer

Universal:
- 1 Springer für alle Gebiete (Backup)
```

## ⚠️ Wichtige Hinweise

1. **Mindestens ein Gebiet**: Dozenten und Springer müssen mindestens ein Rechtsgebiet haben
2. **Benachrichtigungen**: Benutzer mit mehreren Gebieten erhalten mehr Benachrichtigungen
3. **Performance**: Array-Abfragen sind optimiert, aber bei sehr vielen Benutzern zu beachten
4. **Konsistenz**: Legacy-Feld wird automatisch mit erstem Array-Element synchronisiert

Das Multi-Legal-Area System ist vollständig implementiert und einsatzbereit! 🎉
