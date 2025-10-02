# Guest Checkout System Guide

Vollständige Implementierung des Guest Checkout Systems für nicht-registrierte Benutzer.

## Problem gelöst

**Vorher:** Nur eingeloggte User konnten Pakete kaufen → Registrierung erforderlich vor Kauf
**Nachher:** Jeder kann Pakete kaufen → User wird automatisch während/nach dem Kauf erstellt

## Architektur

```
Guest User → /packages → Guest Checkout → Stripe → Webhook → User Creation → Credits
```

## Implementierte Komponenten

### 1. Frontend: PackagesPage.tsx
```typescript
const handlePurchase = async (packageId: string) => {
  if (user) {
    // Eingeloggter User - bestehender Flow
    const { url } = await createCheckoutSession({ packageId, userId: user.id })
  } else {
    // Guest Checkout - neuer Flow
    const { url } = await createGuestCheckoutSession({ packageId })
  }
  window.location.href = url
}
```

### 2. Utils: stripeUtils.ts
```typescript
export const createGuestCheckoutSession = async (
  request: { packageId: string }
): Promise<{ url: string }> => {
  // Ruft create-guest-checkout-session Edge Function auf
  // Kein userId erforderlich
}
```

### 3. Edge Function: create-guest-checkout-session
```typescript
const session = await stripe.checkout.sessions.create({
  // Kein customer_email - User gibt eigene Email ein
  customer_creation: 'always', // Erstellt immer Stripe Customer
  metadata: {
    packageId: packageId,
    guestCheckout: 'true' // Markiert als Guest Checkout
  }
})
```

### 4. Webhook: stripe-webhook (erweitert)
```typescript
// Neue Guest Checkout Verarbeitung
if (isGuestCheckout) {
  await handleGuestCheckoutSession(supabaseClient, checkoutSession, packageId)
}
```

## Guest Checkout Workflow

### 1. **User wählt Paket (nicht eingeloggt)**
- Geht zu `/packages`
- Klickt "Jetzt kaufen" bei beliebigem Paket
- Wird zu Stripe Checkout weitergeleitet

### 2. **Stripe Checkout**
- User gibt **Email und Zahlungsdaten ein** (erforderlich)
- User gibt **Rechnungsadresse mit vollständigem Namen ein** (erforderlich)
- Optional: Lieferadresse für DACH-Region
- Stripe erstellt automatisch Customer
- Payment wird verarbeitet

### 3. **Webhook Verarbeitung**
```typescript
async function handleGuestCheckoutSession(supabaseClient, checkoutSession, packageId) {
  // 1. Email aus Checkout Session extrahieren
  const customerEmail = checkoutSession.customer_details?.email
  
  // 2. Prüfen ob User bereits existiert
  const existingUser = await findUserByEmail(customerEmail)
  
  if (existingUser) {
    // 3a. Bestehenden User mit Stripe Customer verknüpfen
    await linkUserToStripeCustomer(existingUser.id, stripeCustomerId)
    userId = existingUser.id
  } else {
    // 3b. Neuen User erstellen
    const newUser = await createUserFromGuestCheckout({
      email: customerEmail,
      firstName, lastName, // aus Stripe Name geparst
      stripeCustomerId,
      role: 'student',
      credits: 0
    })
    userId = newUser.id
  }
  
  // 4. Order erstellen
  await createOrder({ userId, packageId, status: 'completed' })
  
  // 5. Credits hinzufügen
  await addCreditsToUser(userId, packageData.case_study_count)
  
  // 6. Willkommens-Benachrichtigung
  await createNotification({
    title: 'Willkommen bei Kraatz Club!',
    message: 'Bestellung erfolgreich, Sie können sich jetzt einloggen'
  })
}
```

### 4. **User kann sich einloggen**
- User erhält Benachrichtigung über erfolgreiche Bestellung
- User kann sich mit Email + Passwort einloggen (Passwort-Reset verwenden)
- Credits sind bereits verfügbar
- Alle Plattform-Features sofort nutzbar

## Technische Details

### **Stripe Customer Erstellung**
```typescript
customer_creation: 'always', // Erstellt immer neuen Customer
billing_address_collection: 'required', // Rechnungsadresse mit Name erforderlich
shipping_address_collection: {
  allowed_countries: ['DE', 'AT', 'CH'] // DACH-Region
},
phone_number_collection: {
  enabled: false // Telefonnummer optional
}
```

### **Metadata Tracking**
```typescript
metadata: {
  packageId: packageId,
  guestCheckout: 'true', // Kennzeichnet Guest Checkout
  packageName: packageData.name,
  caseStudyCount: packageData.case_study_count.toString()
}
```

### **User-Erstellung**
```typescript
// Name aus Billing Address parsen
const fullName = checkoutSession.customer_details?.address?.name
const nameParts = fullName.split(' ')
const firstName = nameParts[0] || null
const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null

// Neue User werden mit allen erforderlichen Feldern erstellt:
{
  email: customerEmail, // Aus Stripe Checkout
  first_name: firstName, // Aus Billing Address Name geparst
  last_name: lastName, // Aus Billing Address Name geparst
  role: 'student', // Standard-Rolle
  account_credits: 0, // Startwert (wird dann erhöht)
  stripe_customer_id: stripeCustomerId, // Sofortige Verknüpfung
  email_notifications_enabled: true
}
```

## Vorteile

### **Für Benutzer:**
✅ **Keine Registrierung erforderlich** vor Kauf
✅ **Sofortiger Kauf möglich** - weniger Reibung
✅ **Automatische Account-Erstellung** - nahtlose Erfahrung
✅ **Credits sofort verfügbar** nach Zahlung

### **Für Business:**
✅ **Höhere Conversion Rate** - weniger Abbrüche
✅ **Automatische User-Akquisition** - jeder Kauf = neuer User
✅ **Stripe Customer Sync** - vollständige Integration
✅ **Keine manuellen Eingriffe** erforderlich

## Sicherheit

### **Stripe Integration:**
- ✅ **PCI Compliance** - Stripe verarbeitet alle Zahlungsdaten
- ✅ **Webhook Verification** - Signatur-Validierung
- ✅ **Customer Creation** - Automatische Stripe Customer Erstellung

### **User Management:**
- ✅ **Email Validation** - Nur gültige Emails akzeptiert
- ✅ **Duplicate Prevention** - Bestehende User werden verknüpft, nicht dupliziert
- ✅ **Secure Defaults** - Standard-Rolle und Berechtigungen

## Testing

### **Test Guest Checkout:**
1. **Gehe zu `/packages`** (nicht eingeloggt)
2. **Wähle beliebiges Paket** → "Jetzt kaufen"
3. **Stripe Checkout** → Email + Test-Kreditkarte eingeben
4. **Erfolgreiche Zahlung** → Automatische Weiterleitung
5. **Prüfe Database** → Neuer User mit Credits erstellt

### **Test Bestehender User:**
1. **Bestehender User kauft als Guest** (andere Email)
2. **System erkennt Email** → Verknüpft mit bestehendem Account
3. **Credits werden hinzugefügt** → Keine Duplikate

## Monitoring

### **Edge Function Logs:**
```bash
supabase functions logs stripe-webhook
```

### **Wichtige Log-Nachrichten:**
```
🎯 Processing guest checkout session
👤 Creating new user from guest checkout
✅ Found existing user: [userId]
🎉 Guest checkout processed successfully
```

### **Database Queries:**
```sql
-- Neue Guest Checkout Users
SELECT email, stripe_customer_id, created_at 
FROM users 
WHERE stripe_customer_id IS NOT NULL 
ORDER BY created_at DESC;

-- Guest Checkout Orders
SELECT o.*, u.email 
FROM orders o 
JOIN users u ON o.user_id = u.id 
WHERE o.stripe_payment_intent_id LIKE 'cs_%' -- Checkout Session IDs
ORDER BY o.created_at DESC;
```

## Ergebnis

**Das Guest Checkout System ist vollständig funktional:**

✅ **Frontend** - Unterstützt eingeloggte und nicht-eingeloggte User
✅ **Edge Functions** - Separate Guest Checkout Verarbeitung  
✅ **Webhook** - Automatische User-Erstellung und Credit-Zuweisung
✅ **Database** - Vollständige User-Stripe Synchronisation
✅ **UX** - Nahtlose Kauferfahrung ohne Registrierung

**Jeder kann jetzt Pakete kaufen und wird automatisch zum Kraatz Club User!** 🎉
