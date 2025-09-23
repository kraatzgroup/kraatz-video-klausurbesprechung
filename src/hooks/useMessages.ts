import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChatUser } from '../utils/chatPermissions';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  message_type: 'text' | 'system';
  sender?: ChatUser;
}

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const MESSAGES_PER_PAGE = 50;

  // Nachrichten laden
  const fetchMessages = useCallback(async (reset = false) => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);
      setError(null);

      const startIndex = reset ? 0 : page * MESSAGES_PER_PAGE;
      const endIndex = startIndex + MESSAGES_PER_PAGE - 1;

      // First get messages
      const { data: messagesData, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);

      if (fetchError) throw fetchError;

      // Then get sender info for each message
      const newMessages: Message[] = [];
      if (messagesData) {
        for (const message of messagesData) {
          const { data: senderData } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, role')
            .eq('id', message.sender_id)
            .single();

          newMessages.push({
            ...message,
            sender: senderData || {
              id: message.sender_id,
              email: 'Unknown',
              first_name: 'Unknown',
              last_name: 'User',
              role: 'student'
            }
          });
        }
      }

      if (reset) {
        setMessages(newMessages);
        setPage(1);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        setPage(prev => prev + 1);
      }

      setHasMore(newMessages.length === MESSAGES_PER_PAGE);
    } catch (err) {
      console.error('❌ Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      setMessages([]); // Clear messages on error
      setHasMore(false);
    } finally {
      console.log('✅ Finished loading messages, setting loading to false');
      setLoading(false);
    }
  }, [conversationId, user, page]);

  // Nachricht senden
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!conversationId || !user || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [conversationId, user]);

  // Nachricht bearbeiten
  const editMessage = useCallback(async (messageId: string, newContent: string): Promise<boolean> => {
    if (!user || !newContent.trim()) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user.id); // Nur eigene Nachrichten bearbeiten

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error editing message:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit message');
      return false;
    }
  }, [user]);

  // Nachricht löschen
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      return false;
    }
  }, [user]);

  // System-Nachricht senden (z.B. "User joined")
  const sendSystemMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!conversationId || !user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: 'system'
        });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error sending system message:', err);
      return false;
    }
  }, [conversationId, user]);

  // Ältere Nachrichten laden
  const loadMoreMessages = useCallback(() => {
    if (!loading && hasMore) {
      fetchMessages(false);
    }
  }, [loading, hasMore, fetchMessages]);

  // Real-time Subscription für neue Nachrichten
  useEffect(() => {
    if (!conversationId) return;

    const messageSubscription = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Neue Nachricht mit Sender-Informationen laden
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users(id, email, first_name, last_name, role)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Bearbeitete Nachricht aktualisieren
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users(id, email, first_name, last_name, role)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => 
              prev.map(msg => msg.id === data.id ? data : msg)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => 
            prev.filter(msg => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [conversationId]);

  // Nachrichten laden wenn Konversation wechselt
  useEffect(() => {
    if (conversationId) {
      console.log('🔄 Loading messages for conversation:', conversationId);
      setMessages([]);
      setPage(0);
      setHasMore(true);
      setError(null);
      fetchMessages(true);
    } else {
      // Reset state when no conversation is selected
      setMessages([]);
      setLoading(false);
      setError(null);
      setHasMore(false);
    }
  }, [conversationId]); // REMOVED fetchMessages dependency to prevent loop

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    sendSystemMessage,
    loadMoreMessages,
    refetch: () => fetchMessages(true)
  };
};
