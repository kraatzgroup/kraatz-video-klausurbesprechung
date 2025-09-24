# 🗑️ Note entfernen - Button hinzufügen

## Problem verstehen

**Aktuelles Verhalten (korrekt):**
- ✅ Leeres Feld → Button deaktiviert (richtig!)
- ✅ Note eingeben → Button aktiviert (richtig!)

**Was fehlt:**
- ❌ Möglichkeit bestehende Noten zu **löschen**

## 🔧 Lösung: Entfernen-Button hinzufügen

### 1. Automatisches Script ausführen
```bash
./scripts/add-remove-grade-button.sh
```

### 2. Manuelle Button-Platzierung

**Suche nach jedem "Note speichern" Button und füge danach hinzu:**

```typescript
{/* Bestehender Speichern-Button */}
<button
  onClick={() => {
    const currentGrade = grades[request.id];
    if (currentGrade && currentGrade.grade >= 0 && currentGrade.grade <= 18) {
      updateGrade(request.id, currentGrade.grade, currentGrade.gradeText);
    }
  }}
  disabled={grades[request.id]?.grade === undefined || grades[request.id]?.grade === null || grades[request.id]?.grade < 0 || grades[request.id]?.grade > 18}
  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
>
  Note speichern
</button>

{/* NEUER Entfernen-Button - nur wenn Note existiert */}
{grades[request.id]?.grade !== undefined && (
  <button
    onClick={() => removeGrade(request.id)}
    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1 ml-2"
    title="Note entfernen"
  >
    <Trash2 className="w-4 h-4" />
    Entfernen
  </button>
)}
```

### 3. Button-Container anpassen

**Ändere das Button-Container Layout:**

```typescript
{/* ALT: */}
<div className="flex flex-col gap-2">
  {/* ... inputs ... */}
  <button>Note speichern</button>
</div>

{/* NEU: */}
<div className="flex flex-col gap-2">
  {/* ... inputs ... */}
  <div className="flex gap-2">
    <button className="flex-1">Note speichern</button>
    {grades[request.id]?.grade !== undefined && (
      <button className="px-3 py-2 bg-red-600...">
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  </div>
</div>
```

## 🎯 Erwartetes Verhalten nach Implementation

| Situation | Speichern-Button | Entfernen-Button |
|-----------|------------------|------------------|
| **Leeres Feld** | ❌ Deaktiviert | ❌ Nicht sichtbar |
| **Note eingegeben (nicht gespeichert)** | ✅ Aktiviert | ❌ Nicht sichtbar |
| **Note gespeichert** | ✅ Aktiviert | ✅ Sichtbar (rot) |
| **Nach Entfernen** | ❌ Deaktiviert | ❌ Nicht sichtbar |

## 🧪 Testen

### Szenario 1: Note hinzufügen
1. Gib Note ein → Speichern-Button aktiviert
2. Klick "Note speichern" → Note wird gespeichert
3. Roter "Entfernen"-Button erscheint

### Szenario 2: Note entfernen
1. Bei bestehender Note → Roter Button sichtbar
2. Klick "Entfernen" → Bestätigungsdialog
3. Bestätigen → Note aus DB gelöscht
4. Eingabefeld wird geleert
5. Entfernen-Button verschwindet

### Szenario 3: Note ändern
1. Bei bestehender Note → Ändere Wert im Feld
2. Speichern-Button aktiviert
3. Entfernen-Button bleibt sichtbar
4. Speichern überschreibt alte Note

## 🔍 Debugging

**Falls Entfernen-Button nicht erscheint:**
```javascript
// Browser-Konsole:
console.log('Grades:', grades);
console.log('Has grade?', grades[requestId]?.grade !== undefined);
```

**Falls removeGrade Funktion fehlt:**
- Prüfe ob Script ausgeführt wurde
- Suche nach "removeGrade" in InstructorDashboard.tsx
- Füge Funktion manuell hinzu (siehe Script-Inhalt)

## 💡 Verbesserungsvorschläge

### Icon-Only Button (platzsparend):
```typescript
<button
  onClick={() => removeGrade(request.id)}
  className="px-2 py-2 bg-red-600 text-white rounded hover:bg-red-700"
  title="Note entfernen"
>
  <Trash2 className="w-4 h-4" />
</button>
```

### Mit Bestätigungstext:
```typescript
onClick={() => {
  if (window.confirm(`Note ${grades[request.id]?.grade} wirklich entfernen?`)) {
    removeGrade(request.id);
  }
}}
```

Das sollte das Problem lösen - Sie können dann bestehende Noten mit dem roten Entfernen-Button löschen!
