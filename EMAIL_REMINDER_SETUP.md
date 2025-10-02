# E-Mail-Erinnerungssystem für Wiederholungstermine

## Übersicht

Das E-Mail-Erinnerungssystem ermöglicht es Studenten, automatische E-Mail-Benachrichtigungen für ihre Wiederholungstermine zu erhalten. **Das System nutzt dieselbe Mailgun-Infrastruktur wie alle anderen Kraatz Club Benachrichtigungen.**

## Features

- ✅ **Checkbox im Feedback-Formular** für E-Mail-Erinnerungen
- ✅ **Automatische tägliche Überprüfung** auf fällige Erinnerungen
- ✅ **Professionelle E-Mail-Templates** mit Kraatz Club Branding
- ✅ **Personalisierte Inhalte** mit Feedback-Details
- ✅ **Tracking** um Duplikate zu vermeiden

## Datenbankschema

### Neue Spalten in `student_feedback`:
- `email_reminder` (BOOLEAN) - Ob Student E-Mail-Erinnerung wünscht
- `reminder_sent` (BOOLEAN) - Ob Erinnerung bereits gesendet wurde

## Setup-Schritte

### 1. Datenbank-Migration ausführen

```bash
node scripts/add-email-reminder-column.js
```

### 2. Supabase Edge Function deployen

```bash
# Edge Function für E-Mail-Versand deployen
supabase functions deploy send-reminder-emails
```

### 3. Umgebungsvariablen setzen

In Supabase Dashboard → Settings → Environment Variables:

```
SITE_URL=https://your-domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### 4. Cron Job einrichten

#### Option A: Supabase Cron (empfohlen)
```sql
-- In Supabase SQL Editor ausführen
SELECT cron.schedule(
  'daily-reminder-check',
  '0 9 * * *', -- Täglich um 9:00 Uhr
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-reminder-emails',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}',
    body := '{"source": "supabase-cron"}'
  );
  $$
);
```

#### Option B: Server Cron Job
```bash
# Crontab bearbeiten
crontab -e

# Hinzufügen (täglich um 9:00 Uhr):
0 9 * * * cd /path/to/kraatz-club && node scripts/daily-reminder-check.js
```

#### Option C: GitHub Actions (für Hosting auf GitHub)
```yaml
# .github/workflows/daily-reminders.yml
name: Daily Email Reminders
on:
  schedule:
    - cron: '0 9 * * *' # Daily at 9:00 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/daily-reminder-check.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## E-Mail-Service Integration

**Das System nutzt Mailgun - dieselbe E-Mail-Infrastruktur wie alle anderen Kraatz Club Benachrichtigungen.**

### Mailgun-Integration (bereits konfiguriert)
```typescript
// In send-reminder-emails Edge Function
const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
const mailgunDomain = 'kraatz-group.de'

const formData = new FormData()
formData.append('from', 'Kraatz Club <noreply@kraatz-group.de>')
formData.append('to', user.email)
formData.append('subject', `[Kraatz-Club] ${emailSubject}`)
formData.append('html', emailHtml)

const emailResponse = await fetch(
  `https://api.eu.mailgun.net/v3/${mailgunDomain}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`
    },
    body: formData
  }
)
```

### Vorteile der Mailgun-Integration:
- ✅ **Bereits konfiguriert** - Nutzt bestehende Kraatz Club Infrastruktur
- ✅ **Konsistente Absender-Domain** - noreply@kraatz-group.de
- ✅ **Gleiche Authentifizierung** - Verwendet denselben MAILGUN_API_KEY
- ✅ **Bewährte Zuverlässigkeit** - Läuft bereits für andere Benachrichtigungen
- ✅ **Einheitliches Branding** - [Kraatz-Club] Präfix wie andere E-Mails

## Benutzerfluss

1. **Student erstellt Feedback** → Kann Checkbox für E-Mail-Erinnerung aktivieren
2. **Täglich um 9:00 Uhr** → Cron Job prüft fällige Erinnerungen
3. **E-Mail wird versendet** → Mit personalisierten Feedback-Inhalten
4. **Tracking aktualisiert** → `reminder_sent = true` um Duplikate zu vermeiden

## E-Mail-Template

Die E-Mail enthält:
- **Kraatz Club Branding** mit professionellem Design
- **Klausur-Details** (Rechtsgebiet, Teilgebiet, etc.)
- **Persönliche Erkenntnisse** des Students
- **Verbesserungsziele** des Students
- **Link zum Dashboard**

## Monitoring

### Logs überprüfen:
```bash
# Supabase Edge Function Logs
supabase functions logs send-reminder-emails

# Lokaler Test
node scripts/daily-reminder-check.js
```

### Datenbank-Queries für Monitoring:
```sql
-- Anzahl aktiver E-Mail-Erinnerungen
SELECT COUNT(*) FROM student_feedback 
WHERE email_reminder = true AND reminder_sent = false;

-- Heute fällige Erinnerungen
SELECT COUNT(*) FROM student_feedback 
WHERE review_date = CURRENT_DATE 
AND email_reminder = true 
AND reminder_sent = false;

-- Bereits gesendete Erinnerungen heute
SELECT COUNT(*) FROM student_feedback 
WHERE review_date = CURRENT_DATE 
AND reminder_sent = true;
```

## Troubleshooting

### Häufige Probleme:

1. **E-Mails werden nicht versendet**
   - Prüfe E-Mail-Service API-Keys
   - Überprüfe Supabase Edge Function Logs
   - Teste manuell: `node scripts/daily-reminder-check.js`

2. **Cron Job läuft nicht**
   - Prüfe Cron-Syntax
   - Überprüfe Server-Logs
   - Teste manuellen Aufruf

3. **Duplikate E-Mails**
   - Prüfe `reminder_sent` Flag in Datenbank
   - Überprüfe Cron-Häufigkeit

### Debug-Commands:
```bash
# Test Edge Function lokal
supabase functions serve send-reminder-emails

# Test mit curl
curl -X POST http://localhost:54321/functions/v1/send-reminder-emails \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual-test"}'
```

## Sicherheit

- ✅ **Service Role Key** nur in sicherer Umgebung
- ✅ **E-Mail-Adressen** werden nicht geloggt
- ✅ **Rate Limiting** durch tägliche Ausführung
- ✅ **Opt-in System** - nur bei aktivierter Checkbox
