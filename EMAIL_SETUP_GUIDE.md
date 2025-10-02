# 📧 E-Mail-Setup Anleitung

## Warum kam die Test-E-Mail nicht an?

Die erste Test-E-Mail war nur eine **Simulation** - sie wurde nicht wirklich versendet. Um echte E-Mails zu versenden, benötigen wir einen E-Mail-Service.

## 🚀 Schnellste Lösung: Resend (Empfohlen)

### 1. Kostenloses Konto erstellen
- Gehe zu [resend.com](https://resend.com)
- Registriere dich kostenlos (3000 E-Mails/Monat gratis)
- Bestätige deine E-Mail-Adresse

### 2. API-Key erstellen
- Gehe zu "API Keys" im Dashboard
- Klicke "Create API Key"
- Name: "Kraatz Club Reminders"
- Kopiere den API-Key (beginnt mit `re_`)

### 3. API-Key setzen
```bash
export RESEND_API_KEY="re_your_api_key_here"
```

### 4. Test-E-Mail senden
```bash
node scripts/send-email-via-resend.js
```

## 🔧 Alternative: Gmail SMTP

### 1. Gmail vorbereiten
- Aktiviere 2-Faktor-Authentifizierung
- Gehe zu "App-Passwörter" in den Google-Kontoeinstellungen
- Erstelle ein App-Passwort für "Mail"

### 2. Umgebungsvariablen setzen
```bash
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-16-char-app-password"
```

### 3. Test-E-Mail senden
```bash
node scripts/send-real-test-email.js
```

## 🔧 Alternative: GMX/Web.de SMTP

### 1. SMTP-Einstellungen
```bash
export SMTP_HOST="smtp.gmx.net"
export SMTP_USER="your-email@gmx.de"
export SMTP_PASSWORD="your-password"
```

### 2. Test-E-Mail senden
```bash
node scripts/send-real-test-email.js
```

## 📋 Vollständige Produktions-Einrichtung

### 1. E-Mail-Service wählen und konfigurieren
- **Resend** (empfohlen): Einfach, kostenlos, zuverlässig
- **Gmail**: Gut für Tests, aber Limits
- **SendGrid**: Professionell, mehr Features

### 2. Supabase Edge Function deployen
```bash
supabase functions deploy send-reminder-emails
```

### 3. Umgebungsvariablen in Supabase setzen
- Gehe zu Supabase Dashboard → Settings → Environment Variables
- Füge hinzu: `RESEND_API_KEY` oder `GMAIL_USER` + `GMAIL_APP_PASSWORD`

### 4. Cron Job einrichten
```sql
-- In Supabase SQL Editor
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

## 🧪 Testen der E-Mail-Funktionalität

### Lokaler Test (mit Resend)
```bash
# API-Key setzen
export RESEND_API_KEY="re_your_api_key"

# Test-E-Mail senden
node scripts/send-email-via-resend.js
```

### Lokaler Test (mit Gmail)
```bash
# Credentials setzen
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-app-password"

# Test-E-Mail senden
node scripts/send-real-test-email.js
```

### Edge Function Test
```bash
# Edge Function lokal starten
supabase functions serve send-reminder-emails

# Test-Aufruf
curl -X POST http://localhost:54321/functions/v1/send-reminder-emails \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual-test"}'
```

## 🔍 Troubleshooting

### E-Mail kommt nicht an
1. **Spam-Ordner prüfen**
2. **API-Key korrekt?** - Prüfe Umgebungsvariable
3. **Domain verifiziert?** - Bei Resend ggf. Domain hinzufügen
4. **Logs prüfen** - Supabase Function Logs anschauen

### Häufige Fehler
- **"Invalid API key"** → API-Key falsch oder abgelaufen
- **"Domain not verified"** → Bei Resend Domain verifizieren
- **"Authentication failed"** → Bei Gmail App-Passwort verwenden
- **"SMTP timeout"** → Firewall/Proxy-Probleme

## 📊 Monitoring

### Resend Dashboard
- Gehe zu resend.com Dashboard
- Sieh E-Mail-Status und Delivery-Rate
- Prüfe Bounce/Complaint-Rate

### Supabase Logs
```bash
supabase functions logs send-reminder-emails
```

### Datenbank-Queries
```sql
-- Heute gesendete Erinnerungen
SELECT COUNT(*) FROM student_feedback 
WHERE review_date = CURRENT_DATE 
AND reminder_sent = true;

-- Pending Erinnerungen
SELECT COUNT(*) FROM student_feedback 
WHERE review_date <= CURRENT_DATE 
AND email_reminder = true 
AND reminder_sent = false;
```

## 💡 Tipps

1. **Resend verwenden** - Einfachste und zuverlässigste Option
2. **Kleine Tests** - Erst mit wenigen E-Mails testen
3. **Spam vermeiden** - Professionelle E-Mail-Templates verwenden
4. **Monitoring** - Regelmäßig Delivery-Rate prüfen
5. **Backup-Service** - Zweiten E-Mail-Service als Fallback

## 🎯 Nächste Schritte

1. **Resend-Konto erstellen** und API-Key holen
2. **Test-E-Mail senden** mit `send-email-via-resend.js`
3. **Edge Function deployen** mit E-Mail-Service
4. **Cron Job aktivieren** für tägliche Erinnerungen
5. **Monitoring einrichten** für Delivery-Tracking

Nach der Einrichtung erhalten Studenten automatisch personalisierte E-Mail-Erinnerungen an ihren Wiederholungsterminen! 📚✨
