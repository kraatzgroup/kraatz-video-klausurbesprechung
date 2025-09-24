# 📝 NULL/Leere Noten speichern

## Ziel
Ermögliche das Speichern von **leeren Werten** als Note, um bestehende Noten zu "löschen" ohne den Datensatz zu entfernen.

## 🔧 Implementierung

### 1. Button-Validierung entfernen

**Suche nach (ALLE 4 Tabs):**
```typescript
disabled={grades[request.id]?.grade === undefined || grades[request.id]?.grade === null || grades[request.id]?.grade < 0 || grades[request.id]?.grade > 18}
```

**Ersetze mit:**
```typescript
disabled={false}
```

**Oder intelligenter (mit Validierung für ungültige Werte):**
```typescript
disabled={grades[request.id]?.grade !== undefined && grades[request.id]?.grade !== null && (grades[request.id]?.grade < 0 || grades[request.id]?.grade > 18)}
```

### 2. onChange Handler anpassen

**Suche nach:**
```typescript
onChange={(e) => {
  const value = e.target.value;
  const grade = value === '' ? undefined : parseFloat(value);
  const gradeDescription = (grade !== undefined && grade >= 0) ? getGradeDescription(grade) : '';
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
  const gradeDescription = (grade !== null && grade !== undefined && grade >= 0) ? getGradeDescription(grade) : '';
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

### 3. updateGrade Funktion erweitern

**Suche nach:**
```typescript
if (grade !== undefined && grade >= 0 && grade <= 18) {
  updateGrade(request.id, grade, grades[request.id]?.gradeText);
}
```

**Ersetze mit:**
```typescript
// Erlaube NULL-Werte oder gültige Noten
if (grade === null || grade === undefined || (grade >= 0 && grade <= 18)) {
  updateGrade(request.id, grade, grades[request.id]?.gradeText);
} else {
  alert('Bitte geben Sie eine gültige Note zwischen 0 und 18 ein oder lassen Sie das Feld leer.');
}
```

### 4. updateGrade Datenbank-Logik anpassen

**In der updateGrade Funktion:**
```typescript
const updateGrade = async (caseStudyId: string, grade: number | null, gradeText?: string) => {
  try {
    // Check if submission exists
    const { data: existingSubmission, error: fetchError } = await supabase
      .from('submissions')
      .select('id')
      .eq('case_study_request_id', caseStudyId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingSubmission) {
      // Update existing submission
      const { error } = await supabase
        .from('submissions')
        .update({ 
          grade: grade, // NULL wird korrekt gespeichert
          grade_text: gradeText || null
        })
        .eq('case_study_request_id', caseStudyId);

      if (error) throw error;
    } else if (grade !== null && grade !== undefined) {
      // Nur neue Submission erstellen wenn tatsächlich eine Note vorhanden
      const { error } = await supabase
        .from('submissions')
        .insert({
          case_study_request_id: caseStudyId,
          file_url: 'placeholder-url',
          file_type: 'pdf',
          status: 'corrected',
          grade: grade,
          grade_text: gradeText || null,
          corrected_at: new Date().toISOString()
        });

      if (error) throw error;
    }

    fetchData();
    alert(grade === null ? 'Note erfolgreich entfernt!' : 'Note erfolgreich gespeichert!');
  } catch (error) {
    console.error('Error updating grade:', error);
    alert('Fehler beim Speichern der Note');
  }
};
```

### 5. getGradeDescription erweitern

**Erweitere die Funktion:**
```typescript
const getGradeDescription = (points: number | null | undefined): string => {
  if (points === null || points === undefined) return '';
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

### 6. Button-Text anpassen

**Mache den Button-Text dynamischer:**
```typescript
<button
  onClick={() => {
    const currentGrade = grades[request.id];
    const grade = currentGrade?.grade;
    
    if (grade === null || grade === undefined || (grade >= 0 && grade <= 18)) {
      updateGrade(request.id, grade, currentGrade?.gradeText);
    } else {
      alert('Bitte geben Sie eine gültige Note zwischen 0 und 18 ein oder lassen Sie das Feld leer.');
    }
  }}
  disabled={false}
  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
  title={grades[request.id]?.grade === null || grades[request.id]?.grade === undefined ? 
    "Leeres Feld löscht die Note" : "Note speichern"}
>
  {grades[request.id]?.grade === null || grades[request.id]?.grade === undefined ? 
    "Note löschen" : "Note speichern"}
</button>
```

## 🎯 Erwartetes Verhalten

| Eingabe | Button-Text | Aktion | Datenbank |
|---------|-------------|--------|-----------|
| **Leeres Feld** | "Note löschen" | ✅ Aktiviert | `grade: null` |
| **0** | "Note speichern" | ✅ Aktiviert | `grade: 0` |
| **1-18** | "Note speichern" | ✅ Aktiviert | `grade: X` |
| **-1 oder 19+** | "Note speichern" | ❌ Fehlermeldung | Keine Änderung |

## 🧪 Test-Szenarien

### Szenario 1: Note löschen
1. **Bestehende Note vorhanden** (z.B. 15 Punkte)
2. **Feld komplett leeren**
3. **Button zeigt "Note löschen"**
4. **Klicken** → Note wird auf NULL gesetzt
5. **Erfolg:** "Note erfolgreich entfernt!"

### Szenario 2: Note auf 0 setzen
1. **Bestehende Note vorhanden** (z.B. 15 Punkte)
2. **0 eingeben**
3. **Button zeigt "Note speichern"**
4. **Klicken** → Note wird auf 0 gesetzt
5. **Erfolg:** "Note erfolgreich gespeichert!"

### Szenario 3: Ungültige Note
1. **-5 eingeben**
2. **Button zeigt "Note speichern"**
3. **Klicken** → Fehlermeldung
4. **Fehler:** "Bitte geben Sie eine gültige Note..."

## 💡 Zusätzliche Verbesserungen

### Visual Feedback:
```typescript
// Zeige visuell ob Feld leer ist
<input
  className={`px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
    grades[request.id]?.grade === null || grades[request.id]?.grade === undefined
      ? 'border-red-300 bg-red-50' 
      : 'border-gray-300'
  }`}
  placeholder="Note (0-18) - Leer = Note löschen"
/>
```

### Bestätigung für Löschung:
```typescript
onClick={() => {
  const grade = grades[request.id]?.grade;
  
  if (grade === null || grade === undefined) {
    if (window.confirm('Note wirklich löschen?')) {
      updateGrade(request.id, null, grades[request.id]?.gradeText);
    }
  } else {
    updateGrade(request.id, grade, grades[request.id]?.gradeText);
  }
}}
```

Das ermöglicht es, sowohl Noten zu speichern als auch durch leere Eingaben zu "löschen"!
