# 🏃‍♂️ Springer-System Setup Anleitung

## Übersicht
Das Springer-System ermöglicht es, Urlaubsvertretungen für Dozenten einzurichten. Wenn ein Dozent seine E-Mail-Benachrichtigungen deaktiviert (z.B. während des Urlaubs), werden automatisch die Springer des entsprechenden Rechtsgebiets benachrichtigt.

## 🔧 Springer-Benutzer erstellen

### Schritt 1: Admin-Dashboard öffnen
1. Gehen Sie zu: `http://localhost:3000/admin/dashboard`
2. Klicken Sie auf den Tab **"Alle Benutzer"**

### Schritt 2: Neuen Benutzer erstellen
1. Klicken Sie auf **"Neuen Benutzer erstellen"** (über AdminUserManagement)
2. Füllen Sie das Formular aus:

**Beispiel für Springer Zivilrecht:**
```
Vorname: Max
Nachname: Springer
E-Mail: springer-zivilrecht@kraatz-club.de
Passwort: springer123
Rolle: Springer
Rechtsgebiet: Springer Zivilrecht
```

**Beispiel für Springer Strafrecht:**
```
Vorname: Anna
Nachname: Springer-Straf
E-Mail: springer-strafrecht@kraatz-club.de
Passwort: springer123
Rolle: Springer
Rechtsgebiet: Springer Strafrecht
```

**Beispiel für Springer Öffentliches Recht:**
```
Vorname: Tom
Nachname: Springer-Öffentlich
E-Mail: springer-oeffentlich@kraatz-club.de
Passwort: springer123
Rolle: Springer
Rechtsgebiet: Springer Öffentliches Recht
```

### Schritt 3: Springer-Benutzer verifizieren
Nach der Erstellung sollten Sie die Springer im **"Alle Benutzer"** Tab sehen:
- **Rolle**: Angezeigt als "Springer [Rechtsgebiet]"
- **Badge-Farbe**: Indigo für Springer
- **Rechtsgebiet**: Korrekt zugewiesen

## 🔄 Urlaubsvertretung testen

### Schritt 1: Dozent-Benachrichtigungen deaktivieren
1. Als Dozent einloggen (z.B. `dozent@kraatz-club.de`)
2. Gehen Sie zu **Einstellungen**
3. Deaktivieren Sie **"E-Mail-Benachrichtigungen"**
4. Sie sehen den Hinweis: "Urlaubsvertretung aktiv"

### Schritt 2: Klausur einreichen
1. Als Student eine Klausur im entsprechenden Rechtsgebiet einreichen
2. Das System erkennt, dass der Dozent keine Benachrichtigungen erhält
3. Automatisch wird der Springer des Rechtsgebiets benachrichtigt

### Schritt 3: Benachrichtigung verifizieren
- Prüfen Sie die E-Mail-Logs oder Mailgun-Dashboard
- Der Springer sollte eine E-Mail erhalten haben
- Die E-Mail enthält den Hinweis auf die Urlaubsvertretung

## 📧 Zugangsdaten der Springer

```
Springer Zivilrecht:
E-Mail: springer-zivilrecht@kraatz-club.de
Passwort: springer123

Springer Strafrecht:
E-Mail: springer-strafrecht@kraatz-club.de
Passwort: springer123

Springer Öffentliches Recht:
E-Mail: springer-oeffentlich@kraatz-club.de
Passwort: springer123
```

## 🎯 Funktionsweise

### Normale Situation:
- Dozent hat E-Mail-Benachrichtigungen **aktiviert**
- Bei neuer Klausur-Einreichung → **Dozent wird benachrichtigt**

### Urlaubssituation:
- Dozent hat E-Mail-Benachrichtigungen **deaktiviert**
- Bei neuer Klausur-Einreichung → **Springer wird benachrichtigt**

### Automatische Logik:
1. System prüft aktive Dozenten für das Rechtsgebiet
2. Wenn keine aktiven Dozenten → Suche nach Springern
3. Springer des Rechtsgebiets erhalten die Benachrichtigung
4. E-Mail enthält alle relevanten Informationen

## 🔍 Überwachung und Verwaltung

### Admin-Dashboard Features:
- **Statistik-Karten**: Zeigen Anzahl der Springer pro Rechtsgebiet
- **Benutzer-Filter**: Filtern nach Rolle "Springer"
- **Rollenwechsel**: Benutzer können zu/von Springer-Rolle gewechselt werden
- **Rechtsgebiet-Verwaltung**: Springer können zwischen Rechtsgebieten wechseln

### Benachrichtigungs-Status prüfen:
- Gehen Sie zu **Einstellungen** als Dozent/Springer
- Status der E-Mail-Benachrichtigungen ist sichtbar
- Toggle-Switch zum Aktivieren/Deaktivieren

## ⚠️ Wichtige Hinweise

1. **Mindestens ein Springer pro Rechtsgebiet** sollte vorhanden sein
2. **Springer sollten E-Mail-Benachrichtigungen aktiviert** haben
3. **Testen Sie das System** vor dem Produktiveinsatz
4. **Dokumentieren Sie Urlaubszeiten** und entsprechende Springer-Aktivierungen

## 🚀 Nächste Schritte

1. Erstellen Sie die drei Springer-Benutzer wie oben beschrieben
2. Testen Sie die Urlaubsvertretung mit einem Dozenten
3. Verifizieren Sie die E-Mail-Benachrichtigungen
4. Schulen Sie Dozenten im Umgang mit den Einstellungen

Das Springer-System ist jetzt vollständig einsatzbereit! 🎉
