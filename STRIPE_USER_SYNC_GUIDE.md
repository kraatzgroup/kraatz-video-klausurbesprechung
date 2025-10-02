# Stripe User Synchronisation Guide

Dieses Dokument beschreibt die automatische Synchronisation zwischen Stripe-Kunden und Kraatz Club Datenbankbenutzern.

## Problem

Bisher gab es eine Lücke zwischen Stripe-Kunden und unseren Datenbankbenutzern:
- Neue Stripe-Kunden konnten sich einloggen, aber keine Aktionen durchführen
- Keine automatische Verknüpfung zwischen Stripe Customer ID und User ID
- Manuelle Synchronisation erforderlich

## Lösung

Automatische Synchronisation durch Stripe Webhooks und Edge Functions.

## Architektur

```
Stripe Customer Created/Updated
           ↓
    Stripe Webhook
           ↓
  Edge Function: stripe-customer-webhook
           ↓
    Database: users table
           ↓
  Frontend: useStripeAuth Hook
```

## Komponenten

### 1. Database Schema

**Neue Spalte in `users` Tabelle:**
```sql
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT UNIQUE;
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
```

### 2. Edge Function: `stripe-customer-webhook`

**Zweck:** Verarbeitet Stripe Webhook Events für Customer-Änderungen

**Events:**
- `customer.created` - Erstellt neuen User oder verknüpft bestehenden
- `customer.updated` - Aktualisiert User-Informationen

**Logik:**
```typescript
// customer.created Event
if (existingUserByEmail) {
  // User existiert - Stripe Customer ID hinzufügen
  updateUser(userId, { stripe_customer_id: customerId })
} else {
  // Neuen User erstellen
  createUser({
    email: customer.email,
    first_name: firstName,
    last_name: lastName,
    stripe_customer_id: customerId,
    role: 'student',
    account_credits: 0
  })
}
```

### 3. Service: `StripeUserService`

**Zweck:** Zentrale Logik für User-Stripe Synchronisation

**Methoden:**
- `findUserByStripeCustomerId()` - User per Stripe ID finden
- `findUserByEmail()` - User per E-Mail finden
- `createUserFromStripeCustomer()` - Neuen User aus Stripe-Daten erstellen
- `linkUserToStripeCustomer()` - Bestehenden User mit Stripe verknüpfen
- `ensureUserExistsForStripeCustomer()` - User-Existenz sicherstellen

### 4. Hook: `useStripeAuth`

**Zweck:** Erweiterte Auth-Funktionalität mit Stripe-Integration

**Features:**
- Lädt vollständiges User-Profil inklusive `stripe_customer_id`
- Erstellt fehlende User-Profile automatisch
- Prüft Stripe-Customer-Status
- Refresh-Funktionalität für Profile

## Workflow

### Neuer Stripe Customer

1. **Stripe:** Neuer Customer wird erstellt (z.B. bei Checkout)
2. **Webhook:** `customer.created` Event wird gesendet
3. **Edge Function:** Verarbeitet Event
4. **Database Check:** Prüft ob User mit E-Mail existiert
5. **Action:**
   - **User existiert:** Fügt `stripe_customer_id` hinzu
   - **User existiert nicht:** Erstellt neuen User mit Stripe-Daten
6. **Frontend:** User kann sich einloggen und alle Funktionen nutzen

### Customer Update

1. **Stripe:** Customer-Daten werden geändert (Name, E-Mail)
2. **Webhook:** `customer.updated` Event wird gesendet
3. **Edge Function:** Findet User per `stripe_customer_id`
4. **Database:** Aktualisiert User-Daten (Name, E-Mail)

### Login-Prozess

1. **User Login:** Normale Supabase Auth
2. **Profile Load:** `useStripeAuth` lädt vollständiges Profil
3. **Stripe Check:** Prüft ob `stripe_customer_id` vorhanden
4. **Fallback:** Erstellt User-Profil falls nicht vorhanden

## Setup

### 1. Database Schema Update

```bash
node scripts/add-stripe-customer-id.js
```

### 2. Edge Function ist bereits vorhanden

Die `stripe-webhook` Edge Function existiert bereits und wurde erweitert um Customer-Events zu verarbeiten.

### 3. Supabase Environment Variables

In der Supabase Dashboard → Edge Functions → Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_... (bereits vorhanden)
STRIPE_WEBHOOK_SECRET=whsec_... (bereits vorhanden für Payment-Events)
SUPABASE_URL=https://rpgbyockvpannrupicno.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Stripe Webhook Configuration

In Stripe Dashboard → Webhooks:

- **Endpoint URL:** `https://rpgbyockvpannrupicno.supabase.co/functions/v1/stripe-webhook`
- **Events:** `customer.created`, `customer.updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`
- **API Version:** `2023-10-16`

## Testing

### 1. Test Customer Creation

```bash
# Erstelle Test-Customer in Stripe
curl -X POST https://api.stripe.com/v1/customers \
  -u sk_test_...: \
  -d email="test@example.com" \
  -d name="Test User"
```

### 2. Verify Database

```sql
SELECT id, email, first_name, last_name, stripe_customer_id 
FROM users 
WHERE email = 'test@example.com';
```

### 3. Test Login

1. User loggt sich mit `test@example.com` ein
2. `useStripeAuth` sollte vollständiges Profil laden
3. `hasStripeCustomer` sollte `true` sein

## Monitoring

### Edge Function Logs

```bash
supabase functions logs stripe-customer-webhook
```

### Database Queries

```sql
-- Users ohne Stripe Customer ID
SELECT COUNT(*) FROM users WHERE stripe_customer_id IS NULL;

-- Users mit Stripe Customer ID
SELECT COUNT(*) FROM users WHERE stripe_customer_id IS NOT NULL;

-- Neueste Stripe-verknüpfte Users
SELECT email, stripe_customer_id, created_at 
FROM users 
WHERE stripe_customer_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### User kann sich nicht einloggen

1. **Prüfe Supabase Auth:** User in `auth.users` vorhanden?
2. **Prüfe Database:** User in `public.users` vorhanden?
3. **Prüfe Stripe:** Customer in Stripe vorhanden?
4. **Prüfe Webhook:** Logs der Edge Function prüfen

### Webhook funktioniert nicht

1. **Environment Variables:** Alle Secrets korrekt gesetzt?
2. **Stripe Webhook:** Endpoint URL und Events korrekt?
3. **Signature:** Webhook Secret korrekt?
4. **Logs:** Edge Function Logs prüfen

### Doppelte Users

```sql
-- Finde doppelte E-Mails
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;
```

## Security

- **Webhook Signature:** Alle Webhooks werden mit Stripe-Signatur verifiziert
- **Environment Variables:** Secrets nur in Supabase Environment Variables
- **RLS Policies:** Row Level Security für `users` Tabelle aktiv
- **Admin Client:** Verwendet Service Role Key für privilegierte Operationen

## Migration

Für bestehende Users ohne `stripe_customer_id`:

```sql
-- Finde Users ohne Stripe Customer ID
SELECT id, email FROM users WHERE stripe_customer_id IS NULL;
```

Diese Users erhalten automatisch eine Stripe Customer ID bei ihrer ersten Zahlung oder können manuell verknüpft werden.

## Performance

- **Index:** `idx_users_stripe_customer_id` für schnelle Lookups
- **Unique Constraint:** Verhindert doppelte Stripe Customer IDs
- **Debouncing:** Edge Function verarbeitet Events effizient
- **Caching:** `useStripeAuth` cached User-Profile

## Fazit

Das System stellt sicher, dass:
- ✅ Jeder Stripe Customer automatisch einen Database User hat
- ✅ User-Daten zwischen Stripe und Database synchronisiert bleiben
- ✅ Login funktioniert nahtlos für alle Stripe-Kunden
- ✅ Keine manuellen Eingriffe erforderlich sind
- ✅ Bestehende Users weiterhin funktionieren
