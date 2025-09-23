# 💬 Chat-Feature Dokumentation

## Übersicht

Das Chat-Feature ermöglicht rollenbasierte Kommunikation zwischen Benutzern der Kraatz Club Plattform. Es implementiert ein sicheres, real-time Messaging-System mit spezifischen Berechtigungen basierend auf Benutzerrollen.

## 🔐 Berechtigungsmodell

### Rollen und Chat-Berechtigung

| Rolle | Chat-Partner | Beschreibung |
|-------|--------------|--------------|
| **Student** | Nur Admins | Support-Chat für Hilfe und Fragen |
| **Admin** | Alle Rollen | Vollzugriff auf alle Unterhaltungen |
| **Instructor** | Admin, Instructor, Springer | Fachlicher Austausch |
| **Springer** | Admin, Instructor, Springer | Urlaubsvertretung und Koordination |

### Konversationstypen

- **Support**: Student ↔ Admin Unterhaltungen
- **Group**: Alle anderen Kombinationen

## 🏗️ Architektur

### Datenbankschema

```sql
-- Konversationen
conversations (
  id, created_at, updated_at, type, title, created_by
)

-- Teilnehmer
conversation_participants (
  id, conversation_id, user_id, joined_at, last_read_at
)

-- Nachrichten
messages (
  id, conversation_id, sender_id, content, created_at, edited_at, message_type
)
```

### React-Komponenten

```
src/components/chat/
├── ChatLayout.tsx          # Hauptlayout
├── ConversationList.tsx    # Sidebar mit Unterhaltungen
├── ConversationItem.tsx    # Einzelne Unterhaltung
├── ChatWindow.tsx          # Chat-Bereich
├── ChatHeader.tsx          # Header mit Teilnehmern
├── MessageList.tsx         # Nachrichten-Liste
├── Message.tsx             # Einzelne Nachricht
├── MessageInput.tsx        # Eingabefeld
└── UserSelector.tsx        # Benutzerauswahl
```

### Hooks

```
src/hooks/
├── useChat.ts              # Haupt-Chat-Hook
├── useConversations.ts     # Konversations-Management
└── useMessages.ts          # Nachrichten-Management
```

## 🚀 Features

### ✅ Implementiert

- **Real-time Messaging**: Sofortige Nachrichtenübertragung
- **Rollenbasierte Berechtigungen**: Sichere Chat-Partner-Auswahl
- **Ungelesene Nachrichten**: Zähler und Markierungen
- **Nachricht bearbeiten/löschen**: Für eigene Nachrichten
- **Admin-Moderation**: Admins können alle Nachrichten löschen
- **Responsive Design**: Mobile-freundliche Oberfläche
- **Typing Indicators**: Vorbereitet für Live-Typing-Anzeige
- **Message Pagination**: Ältere Nachrichten nachladen
- **Conversation Management**: Erstellen, Beitreten, Verlassen

### 🔄 Geplante Erweiterungen

- **File Uploads**: Dateien und Bilder senden
- **Voice/Video Calls**: Integration von Anruffunktionen
- **Push Notifications**: Browser-Benachrichtigungen
- **Message Search**: Nachrichten durchsuchen
- **Emoji Reactions**: Reaktionen auf Nachrichten
- **Message Threading**: Antworten auf spezifische Nachrichten

## 🛠️ Setup und Installation

### 1. Datenbankschema erstellen

```bash
# Mit Environment Variables
node scripts/setup-chat-database.js

# Oder direkt (für Development)
node scripts/setup-chat-database-direct.js
```

### 2. Dependencies installieren

```bash
npm install date-fns
```

### 3. Navigation aktivieren

Die Chat-Route ist bereits in `App.tsx` und der Navigation in `Header.tsx` integriert.

## 📱 Benutzung

### Für Studenten

1. Navigiere zu `/chat` oder klicke auf "Support Chat"
2. Starte eine neue Unterhaltung mit einem Admin
3. Stelle Fragen oder bitte um Hilfe

### Für Admins/Instructors/Springer

1. Navigiere zu `/chat`
2. Wähle existierende Unterhaltungen oder starte neue
3. Kommuniziere mit anderen Rollen basierend auf Berechtigungen

## 🔒 Sicherheit

### Row Level Security (RLS)

- Benutzer sehen nur Unterhaltungen, in denen sie Teilnehmer sind
- Nachrichten sind nur für Konversationsteilnehmer sichtbar
- Rollenbasierte Erstellung von Unterhaltungen

### Datenvalidierung

- Eingabevalidierung auf Client- und Server-Seite
- XSS-Schutz durch React's eingebaute Mechanismen
- SQL-Injection-Schutz durch Supabase

## 🎨 UI/UX Features

### Design-Prinzipien

- **Konsistent**: Folgt dem bestehenden Design-System
- **Intuitiv**: Bekannte Chat-Patterns
- **Responsive**: Funktioniert auf allen Geräten
- **Accessible**: Keyboard-Navigation und Screen-Reader-Support

### Interaktionen

- **Enter**: Nachricht senden
- **Shift+Enter**: Neue Zeile
- **Escape**: Bearbeitung abbrechen
- **Scroll to Top**: Ältere Nachrichten laden

## 🐛 Troubleshooting

### Häufige Probleme

1. **Keine Nachrichten sichtbar**
   - Prüfe RLS-Policies in Supabase
   - Verifiziere Benutzerrolle in der Datenbank

2. **Real-time Updates funktionieren nicht**
   - Prüfe Supabase Realtime-Konfiguration
   - Überprüfe Browser-Konsole auf WebSocket-Fehler

3. **Chat-Partner nicht verfügbar**
   - Überprüfe Rollenberechtigung in `chatPermissions.ts`
   - Verifiziere Benutzerdaten in der Datenbank

### Debug-Modus

```javascript
// In Browser-Konsole
localStorage.setItem('debug-chat', 'true');
```

## 📊 Performance

### Optimierungen

- **Message Pagination**: Nur 50 Nachrichten initial laden
- **Lazy Loading**: Komponenten bei Bedarf laden
- **Optimistic Updates**: Sofortige UI-Updates
- **Connection Pooling**: Effiziente Datenbankverbindungen

### Monitoring

- Supabase Dashboard für Real-time Connections
- Browser DevTools für Performance-Analyse
- Console-Logs für Debugging

## 🚀 Deployment

### Produktions-Checkliste

- [ ] Environment Variables konfiguriert
- [ ] Supabase RLS-Policies aktiviert
- [ ] Real-time Subscriptions getestet
- [ ] Mobile Responsiveness geprüft
- [ ] Performance-Tests durchgeführt

### Umgebungsvariablen

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📈 Metriken

### Zu überwachende KPIs

- Anzahl aktiver Unterhaltungen
- Nachrichten pro Tag/Woche
- Durchschnittliche Antwortzeit
- Benutzerengagement pro Rolle
- Support-Ticket-Reduktion durch Chat

---

**Entwickelt für Kraatz Club** 🎓  
*Sichere, rollenbasierte Kommunikation für die Rechtsausbildung*
