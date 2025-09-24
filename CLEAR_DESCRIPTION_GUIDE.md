# 🧹 Notenbeschreibung bei leerem Feld entfernen

## Problem
Wenn das Notenfeld geleert wird, bleibt die Beschreibung (z.B. "ungenügend") stehen. Das ist verwirrend für den Benutzer.

## 🎯 Gewünschtes Verhalten

| Eingabe | Beschreibung |
|---------|--------------|
| **Leeres Feld** | ❌ Keine Beschreibung |
| **0** | ✅ "ungenügend (0 Punkte)" |
| **7** | ✅ "befriedigend" |
| **abc** (ungültig) | ❌ Keine Beschreibung |

## 🔧 Lösung implementieren

### Option 1: Automatisches Script
```bash
./scripts/clear-description-on-empty.sh
```

### Option 2: Manuelle Änderungen

#### 1. onChange Handler reparieren (ALLE 4 Tabs)

**Suche nach:**
```typescript
onChange={(e) => {
  const value = e.target.value;
  const grade = value === '' ? null : parseFloat(value);
  const gradeDescription = getGradeDescription(grade);
  setGrades(prev => ({
    ...prev,
    [request.id]: {
      ...prev[request.id],
      grade: grade,
      gradeText: gradeDescription
    }
  }));
}}
```

**Ersetze mit:**
```typescript
onChange={(e) => {
  const value = e.target.value;
  const grade = value === '' ? null : parseFloat(value);
  
  // Beschreibung nur bei gültigen Noten anzeigen
  const gradeDescription = (value === '' || isNaN(grade) || grade === null) 
    ? '' 
    : getGradeDescription(grade);
  
  setGrades(prev => ({
    ...prev,
    [request.id]: {
      ...prev[request.id],
      grade: grade,
      gradeText: gradeDescription
    }
  }));
}}
```

#### 2. Erweiterte Validierung für Beschreibung

**Noch robustere Version:**
```typescript
onChange={(e) => {
  const value = e.target.value.trim(); // Entferne Leerzeichen
  
  let grade: number | null = null;
  let gradeDescription = '';
  
  if (value === '') {
    // Leeres Feld
    grade = null;
    gradeDescription = '';
  } else {
    // Versuche zu parsen
    const parsedGrade = parseFloat(value);
    
    if (isNaN(parsedGrade)) {
      // Ungültige Eingabe
      grade = parsedGrade; // Behalte NaN für Validierung
      gradeDescription = '';
    } else if (parsedGrade >= 0 && parsedGrade <= 18) {
      // Gültige Note
      grade = parsedGrade;
      gradeDescription = getGradeDescription(parsedGrade);
    } else {
      // Außerhalb des gültigen Bereichs
      grade = parsedGrade;
      gradeDescription = '';
    }
  }
  
  setGrades(prev => ({
    ...prev,
    [request.id]: {
      ...prev[request.id],
      grade: grade,
      gradeText: gradeDescription
    }
  }));
}}
```

#### 3. getGradeDescription robuster machen

**Erweitere die Funktion:**
```typescript
const getGradeDescription = (points: number | null | undefined): string => {
  // Explizite Checks für alle ungültigen Werte
  if (points === null || points === undefined || isNaN(points)) {
    return '';
  }
  
  // Bereich-Check
  if (points < 0 || points > 18) {
    return '';
  }
  
  // Gültige Beschreibungen
  if (points === 0) return 'ungenügend (0 Punkte)';
  if (points > 0 && points <= 1.49) return 'ungenügend';
  if (points >= 1.5 && points <= 3.99) return 'mangelhaft';
  if (points >= 4 && points <= 6.49) return 'ausreichend';
  if (points >= 6.5 && points <= 8.99) return 'befriedigend';
  if (points >= 9 && points <= 11.49) return 'vollbefriedigend';
  if (points >= 11.5 && points <= 13.99) return 'gut';
  if (points >= 14 && points <= 18) return 'sehr gut';
  
  return '';
};
```

#### 4. Visual Feedback für leere Felder

**Erweitere das Textarea-Styling:**
```typescript
<textarea
  placeholder={
    grades[request.id]?.grade === null || grades[request.id]?.grade === undefined
      ? "Notenbeschreibung (Note eingeben für automatische Beschreibung)"
      : "Notenbeschreibung (optional)"
  }
  value={grades[request.id]?.gradeText || ''}
  onChange={(e) => {
    const value = e.target.value;
    setGrades(prev => ({
      ...prev,
      [request.id]: {
        ...prev[request.id],
        gradeText: value
      }
    }));
  }}
  rows={2}
  className={`px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
    grades[request.id]?.gradeText === '' ? 'bg-gray-50' : 'bg-white'
  }`}
/>
```

## 🧪 Test-Szenarien

### Szenario 1: Normale Eingabe
1. **Feld ist leer** → Beschreibung leer ✅
2. **Gib "7" ein** → "befriedigend" erscheint ✅
3. **Lösche "7"** → Beschreibung verschwindet ✅

### Szenario 2: Ungültige Eingabe
1. **Gib "abc" ein** → Beschreibung bleibt leer ✅
2. **Gib "25" ein** → Beschreibung bleibt leer ✅
3. **Gib "-5" ein** → Beschreibung bleibt leer ✅

### Szenario 3: Null-Punkt-Spezialfall
1. **Gib "0" ein** → "ungenügend (0 Punkte)" ✅
2. **Lösche "0"** → Beschreibung verschwindet ✅

### Szenario 4: Manuelle Beschreibung
1. **Gib "15" ein** → "sehr gut" erscheint
2. **Ändere Beschreibung manuell** → Bleibt erhalten
3. **Lösche Note** → Beschreibung wird geleert
4. **Gib neue Note ein** → Automatische Beschreibung überschreibt manuelle

## 💡 Erweiterte Features

### 1. Warnung bei manueller Überschreibung
```typescript
const [hasManualDescription, setHasManualDescription] = useState(false);

// Im onChange der Textarea:
onChange={(e) => {
  const value = e.target.value;
  const automaticDescription = getGradeDescription(grades[request.id]?.grade);
  
  setHasManualDescription(value !== automaticDescription && value !== '');
  
  setGrades(prev => ({
    ...prev,
    [request.id]: {
      ...prev[request.id],
      gradeText: value
    }
  }));
}}

// Warnung anzeigen:
{hasManualDescription && (
  <p className="text-xs text-amber-600 mt-1">
    ⚠️ Manuelle Beschreibung - wird bei Notenänderung überschrieben
  </p>
)}
```

### 2. Beschreibung als Placeholder
```typescript
<textarea
  placeholder={getGradeDescription(grades[request.id]?.grade) || "Notenbeschreibung (optional)"}
  value={grades[request.id]?.gradeText || ''}
  className="placeholder-gray-400"
/>
```

### 3. Automatische vs. Manuelle Beschreibung
```typescript
// Unterscheide zwischen automatischer und manueller Beschreibung
interface GradeData {
  grade?: number | null;
  gradeText?: string;
  isAutoDescription?: boolean;
}

// Bei automatischer Beschreibung:
gradeText: gradeDescription,
isAutoDescription: true

// Bei manueller Eingabe:
gradeText: userInput,
isAutoDescription: false
```

Das sorgt für eine konsistente und intuitive Benutzererfahrung!
