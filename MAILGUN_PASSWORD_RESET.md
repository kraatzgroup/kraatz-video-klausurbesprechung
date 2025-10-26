# Mailgun-Based Password Reset System

## Overview
Professional password reset system using Mailgun for styled emails instead of Supabase's default auth emails.

## Implementation

### 1. **Edge Function: send-password-reset**
- **Location:** `/supabase/functions/send-password-reset/index.ts`
- **Purpose:** Sends professional password reset emails via Mailgun
- **Deployed:** ✅ Successfully deployed to Supabase

### 2. **Email Features:**
- **Professional Design:** Matches Kraatz Club branding (white header, no gradients)
- **User Information:** Shows role and legal area specialization
- **Styled Template:** Consistent with welcome emails and other notifications
- **Security Warnings:** Clear 1-hour expiration notice
- **Action Button:** Blue "Passwort zurücksetzen" button
- **Alternative Link:** Copy-paste option if button doesn't work

### 3. **Security Features:**
- **User Validation:** Checks if user exists in database before sending
- **Recovery Tokens:** Uses Supabase's secure recovery token system
- **Custom Domain:** Links redirect to klausuren.kraatz-club.de
- **Privacy Protection:** Doesn't reveal if email exists or not
- **Token Expiration:** 1-hour expiration for security

### 4. **Email Template Structure:**

#### **Header:**
- Clean white background with Kraatz Club logo
- Simple border separator (no gradients)

#### **Main Content:**
- Personalized greeting with user's full name
- Account information box (role and legal area)
- Clear instructions for password reset
- Professional blue action button

#### **Security Section:**
- Yellow warning box with security instructions
- 1-hour expiration notice
- Privacy and security best practices

#### **Footer:**
- Kraatz Club branding
- Support contact information

### 5. **Integration Points:**

#### **ForgotPasswordPage.tsx:**
```typescript
const { data, error } = await supabase.functions.invoke('send-password-reset', {
  body: { email }
})
```

#### **AuthCallbackPage.tsx:**
- Handles recovery tokens from email links
- Verifies tokens and establishes authenticated session
- Shows password reset form for new password entry

### 6. **User Flow:**
1. **User visits** `/forgot-password`
2. **Enters email** and clicks "Reset-E-Mail senden"
3. **Receives styled email** via Mailgun (not Supabase auth)
4. **Clicks reset button** in email
5. **Redirected to** auth/callback with recovery token
6. **Shows password form** (not auto-login)
7. **Enters new password** and submits
8. **Redirected to** admin login page

### 7. **Email Content:**

#### **Subject:** `🔐 Passwort zurücksetzen - Kraatz Club`

#### **Key Elements:**
- Personalized greeting with user's name
- Account details (role, legal area if applicable)
- Blue "Passwort zurücksetzen" button
- Alternative copy-paste link
- Step-by-step instructions
- Security warnings and expiration notice
- Professional Kraatz Club footer

#### **Example Content:**
```
Hallo [Name],

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für den Kraatz Club gestellt.

Ihr Account:
- Rolle: Dozent
- Rechtsgebiet: Zivilrecht

[Passwort zurücksetzen Button]

Nächste Schritte:
• Klicken Sie auf den blauen "Passwort zurücksetzen" Button
• Geben Sie Ihr neues Passwort ein
• Melden Sie sich mit Ihren neuen Zugangsdaten an
• Zugriff auf Ihr Dozent-Dashboard

Sicherheitshinweis:
Dieser Reset-Link ist nur für Sie bestimmt und läuft nach 1 STUNDE ab.
```

### 8. **Technical Benefits:**
- **Mailgun Delivery:** Professional email delivery service
- **Styled Templates:** Consistent with other system emails
- **User Context:** Shows relevant user information
- **Security Compliant:** Uses Supabase's recovery token system
- **Error Handling:** Graceful handling of all scenarios

### 9. **Deployment Status:**
- ✅ **Edge Function Deployed:** send-password-reset active
- ✅ **Frontend Updated:** ForgotPasswordPage uses Edge Function
- ✅ **AuthContext Cleaned:** Removed old resetPassword function
- ✅ **Recovery Flow:** AuthCallbackPage handles recovery tokens
- ✅ **Build Success:** No TypeScript errors

### 10. **Testing:**
- **Manual Test:** Visit `/forgot-password` and test with real email
- **Expected Result:** Professional styled email via Mailgun
- **Recovery Link:** Should contain `type=recovery` parameter
- **Password Form:** Should show after clicking email link

## Benefits Over Supabase Auth Emails:

1. **Professional Branding:** Matches Kraatz Club design
2. **User Context:** Shows role and legal area information
3. **Consistent Styling:** Matches welcome and notification emails
4. **Better UX:** Clear instructions and professional appearance
5. **Mailgun Delivery:** More reliable email delivery
6. **Custom Content:** Tailored messaging for admin/instructor users

## Security Features:

- **Token-Based:** Uses Supabase's secure recovery tokens
- **Time-Limited:** 1-hour expiration for security
- **User Validation:** Only sends to existing database users
- **Privacy Protection:** Doesn't reveal user existence
- **Custom Domain:** Professional klausuren.kraatz-club.de links

The system provides a professional, secure, and user-friendly password reset experience that matches the quality and branding of the Kraatz Club application.
