# 🏖️ Vacation-Springer Flow Documentation

## Übersicht

Das Vacation-Springer System gewährleistet eine nahtlose Benachrichtigung bei Klausur-Einreichungen, auch wenn Dozenten im Urlaub sind.

## 🔄 Funktionsweise

### 1. Normal-Betrieb (Dozent verfügbar)
```
Neue Klausur → Dozent (email_notifications_enabled = true) → E-Mail Benachrichtigung
```

### 2. Urlaubs-Betrieb (Dozent im Urlaub)
```
Neue Klausur → Dozent (email_notifications_enabled = false) → Springer (email_notifications_enabled = true) → E-Mail Benachrichtigung
```

## 🎯 Logik-Fluss

### Schritt 1: Dozenten-Prüfung
```sql
-- Suche aktive Dozenten für Rechtsgebiet
SELECT * FROM users 
WHERE role = 'instructor'
  AND email_notifications_enabled = true
  AND (
    instructor_legal_area = 'Zivilrecht' 
    OR legal_areas @> ARRAY['Zivilrecht']
  )
```

### Schritt 2: Springer-Fallback
```sql
-- Falls keine aktiven Dozenten gefunden
SELECT * FROM users 
WHERE role = 'springer'
  AND email_notifications_enabled = true
  AND (
    instructor_legal_area = 'Zivilrecht' 
    OR legal_areas @> ARRAY['Zivilrecht']
  )
```

## 🏖️ Urlaubs-Szenarien

### Szenario A: Manueller Urlaub
1. **Dozent aktiviert Urlaubsmodus** (Toggle-Schalter)
2. **System setzt** `email_notifications_enabled = false`
3. **Springer werden sofort aktiviert** für neue Benachrichtigungen

### Szenario B: Geplanter Urlaub
1. **Dozent plant Urlaub** mit Kalenderdaten
2. **System speichert** `vacation_start_date` und `vacation_end_date`
3. **Cron Job prüft täglich** um 02:00 Uhr
4. **Automatische Deaktivierung** am Urlaubsbeginn
5. **Automatische Reaktivierung** am Urlaubsende

## ⏰ Cron Job Workflow

### Täglich um 02:00 Uhr:

```javascript
// 1. Finde Benutzer, die heute im Urlaub sein sollten
const usersOnVacation = await supabase
  .from('users')
  .select('*')
  .lte('vacation_start_date', today)
  .gte('vacation_end_date', today)

// 2. Deaktiviere Benachrichtigungen für Urlauber
for (const user of usersOnVacation) {
  if (user.email_notifications_enabled) {
    await supabase
      .from('users')
      .update({ email_notifications_enabled: false })
      .eq('id', user.id)
  }
}

// 3. Finde Benutzer, deren Urlaub beendet ist
const usersReturned = await supabase
  .from('users')
  .select('*')
  .lt('vacation_end_date', today)
  .eq('email_notifications_enabled', false)

// 4. Reaktiviere Benachrichtigungen und lösche Urlaubsdaten
for (const user of usersReturned) {
  await supabase
    .from('users')
    .update({ 
      email_notifications_enabled: true,
      vacation_start_date: null,
      vacation_end_date: null,
      vacation_reason: null
    })
    .eq('id', user.id)
}
```

## 📧 Benachrichtigungs-Logik

### In notify-instructor Edge Function:

```javascript
// 1. Suche aktive Dozenten
const activeInstructors = await supabase
  .from('users')
  .select('*')
  .eq('role', 'instructor')
  .eq('email_notifications_enabled', true)
  .or(`instructor_legal_area.eq.${legalArea},legal_areas.cs.{${legalArea}}`)

let recipients = activeInstructors || []

// 2. Fallback zu Springer wenn keine Dozenten aktiv
if (recipients.length === 0) {
  const springerUsers = await supabase
    .from('users')
    .select('*')
    .eq('role', 'springer')
    .eq('email_notifications_enabled', true)
    .or(`instructor_legal_area.eq.${legalArea},legal_areas.cs.{${legalArea}}`)
  
  recipients = springerUsers || []
}

// 3. Sende E-Mails an alle Empfänger
for (const recipient of recipients) {
  await sendEmail(recipient.email, emailContent)
}
```

## 🎛️ Frontend-Steuerung

### Settings-Seite für Dozenten:

```javascript
// Schneller Urlaubsmodus (Toggle)
const toggleVacation = async () => {
  await supabase
    .from('users')
    .update({ 
      email_notifications_enabled: !emailNotificationsEnabled 
    })
    .eq('id', currentUser.id)
}

// Geplanter Urlaub (Kalender)
const setVacationPeriod = async () => {
  await supabase
    .from('users')
    .update({ 
      email_notifications_enabled: false,
      vacation_start_date: startDate,
      vacation_end_date: endDate,
      vacation_reason: 'Geplanter Urlaub'
    })
    .eq('id', currentUser.id)
}
```

## 🔍 Monitoring & Testing

### Test-Commands:
```bash
# Teste Vacation-Springer Flow
node scripts/test-vacation-springer-flow.js

# Teste Vacation System
node scripts/test-vacation-system.js

# Manueller Edge Function Test
curl -X POST https://rpgbyockvpannrupicno.supabase.co/functions/v1/vacation-checker \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"source": "manual_test"}'
```

### Monitoring-Queries:
```sql
-- Aktuelle Urlauber
SELECT first_name, last_name, vacation_start_date, vacation_end_date, email_notifications_enabled
FROM users 
WHERE vacation_start_date <= CURRENT_DATE 
  AND vacation_end_date >= CURRENT_DATE;

-- Springer-Abdeckung pro Rechtsgebiet
SELECT 
  UNNEST(legal_areas) as legal_area,
  COUNT(*) as springer_count
FROM users 
WHERE role = 'springer' 
  AND email_notifications_enabled = true
GROUP BY UNNEST(legal_areas);

-- Vacation Checker Logs
SELECT * FROM vacation_checker_logs 
ORDER BY executed_at DESC 
LIMIT 10;
```

## ✅ Erfolgskriterien

### Das System funktioniert korrekt wenn:

1. **🏖️ Dozent im Urlaub:**
   - `email_notifications_enabled = false`
   - Springer erhalten Benachrichtigungen
   - Keine verlorenen Benachrichtigungen

2. **🎯 Dozent zurück:**
   - `email_notifications_enabled = true`
   - Urlaubsdaten gelöscht (`vacation_*` = NULL)
   - Dozent erhält wieder Benachrichtigungen

3. **🔄 Springer-Fallback:**
   - Aktiviert nur wenn keine Dozenten verfügbar
   - Unterstützt Multi-Legal-Area System
   - Korrekte E-Mail-Zustellung

4. **⏰ Cron Job:**
   - Läuft täglich um 02:00 Uhr
   - Automatische Urlaubssteuerung
   - Logging aller Aktionen

## 🚨 Troubleshooting

### Häufige Probleme:

1. **Keine Benachrichtigungen:**
   - Prüfe `email_notifications_enabled` Status
   - Prüfe Springer-Verfügbarkeit für Rechtsgebiet
   - Prüfe Edge Function Logs

2. **Cron Job läuft nicht:**
   - Prüfe `pg_cron` Extension
   - Prüfe Cron Job Status: `SELECT * FROM cron.job;`
   - Prüfe vacation_checker_logs Tabelle

3. **Urlaubsende nicht erkannt:**
   - Prüfe Datumsformate in `vacation_end_date`
   - Prüfe Cron Job Ausführung
   - Manuell Edge Function testen

Das System gewährleistet eine 100%ige Benachrichtigungs-Abdeckung durch intelligente Fallback-Mechanismen! 🎯
