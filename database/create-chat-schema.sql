-- Chat-Feature Datenbankschema für Kraatz Club
-- Erstellt Tabellen für rollenbasierte Chat-Funktionalität

-- 1. Chat-Räume/Konversationen
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type TEXT CHECK (type IN ('support', 'group')) DEFAULT 'group',
  title TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Teilnehmer einer Konversation
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 3. Chat-Nachrichten
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system'))
);

-- 4. Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- 5. Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security aktivieren
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies für Conversations
-- Benutzer können Konversationen sehen, in denen sie Teilnehmer sind
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Benutzer können Konversationen erstellen basierend auf ihrer Rolle
CREATE POLICY "Users can create conversations based on role" ON conversations
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        (
            -- Studenten können nur Support-Konversationen erstellen
            (
                (SELECT role FROM users WHERE id = auth.uid()) = 'student' AND
                type = 'support'
            ) OR
            -- Admin/Dozent/Springer können alle Konversationen erstellen
            (
                (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'instructor', 'springer')
            )
        )
    );

-- Benutzer können ihre eigenen Konversationen aktualisieren
CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (created_by = auth.uid());

-- 8. RLS Policies für Conversation Participants
-- Benutzer können Teilnehmer in ihren Konversationen sehen
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Benutzer können sich zu Konversationen hinzufügen (mit Rollenbeschränkungen)
CREATE POLICY "Users can join conversations based on role" ON conversation_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        (
            -- Studenten können nur Support-Konversationen beitreten
            (
                (SELECT role FROM users WHERE id = auth.uid()) = 'student' AND
                conversation_id IN (
                    SELECT id FROM conversations WHERE type = 'support'
                )
            ) OR
            -- Admin/Dozent/Springer können allen Konversationen beitreten
            (
                (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'instructor', 'springer')
            )
        )
    );

-- Benutzer können ihre eigene Teilnahme aktualisieren (last_read_at)
CREATE POLICY "Users can update their own participation" ON conversation_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Benutzer können Konversationen verlassen
CREATE POLICY "Users can leave conversations" ON conversation_participants
    FOR DELETE USING (user_id = auth.uid());

-- 9. RLS Policies für Messages
-- Benutzer können Nachrichten in ihren Konversationen sehen
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Benutzer können Nachrichten in ihren Konversationen senden
CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Benutzer können ihre eigenen Nachrichten bearbeiten
CREATE POLICY "Users can edit their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Admins können alle Nachrichten löschen (Moderation)
CREATE POLICY "Admins can delete any message" ON messages
    FOR DELETE USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin' OR
        sender_id = auth.uid()
    );

-- 10. Hilfsfunktion für ungelesene Nachrichten
CREATE OR REPLACE FUNCTION get_unread_message_count(conversation_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = conversation_uuid
        AND m.created_at > (
            SELECT COALESCE(last_read_at, '1970-01-01'::timestamp)
            FROM conversation_participants
            WHERE conversation_id = conversation_uuid
            AND user_id = auth.uid()
        )
        AND m.sender_id != auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. View für Konversationen mit zusätzlichen Informationen
CREATE OR REPLACE VIEW conversation_details AS
SELECT 
    c.*,
    (
        SELECT COUNT(*) 
        FROM conversation_participants cp 
        WHERE cp.conversation_id = c.id
    ) as participant_count,
    (
        SELECT content 
        FROM messages m 
        WHERE m.conversation_id = c.id 
        ORDER BY m.created_at DESC 
        LIMIT 1
    ) as last_message,
    (
        SELECT m.created_at 
        FROM messages m 
        WHERE m.conversation_id = c.id 
        ORDER BY m.created_at DESC 
        LIMIT 1
    ) as last_message_at,
    get_unread_message_count(c.id) as unread_count
FROM conversations c
WHERE c.id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
);

COMMENT ON TABLE conversations IS 'Chat-Konversationen zwischen Benutzern';
COMMENT ON TABLE conversation_participants IS 'Teilnehmer in Chat-Konversationen';
COMMENT ON TABLE messages IS 'Chat-Nachrichten in Konversationen';
COMMENT ON VIEW conversation_details IS 'Erweiterte Konversationsdetails mit Statistiken';
