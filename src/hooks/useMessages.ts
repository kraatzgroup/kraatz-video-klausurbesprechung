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
  is_deleted?: boolean;
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
        setMessages(newMessages.reverse()); // Reverse to show oldest first
        setPage(1);
      } else {
        setMessages(prev => [...newMessages.reverse(), ...prev]); // Add older messages at the beginning
        setPage(prev => prev + 1);
      }

      setHasMore(newMessages.length === MESSAGES_PER_PAGE);
      
      console.log('📨 Messages loaded:', {
        conversationId,
        newMessagesCount: newMessages.length,
        reset,
        totalMessages: reset ? newMessages.length : messages.length + newMessages.length
      });
    } catch (err) {
      console.error('❌ Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      setMessages([]); // Clear messages on error
      setHasMore(false);
    } finally {
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
        .eq('sender_id', user.id);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent.trim(), edited_at: new Date().toISOString() }
          : msg
      ));

      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  }, [user]);

  // Nachricht löschen (Soft Delete)
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_deleted: true,
          content: '[Nachricht gelöscht]'
        })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: '[Nachricht gelöscht]', is_deleted: true }
          : msg
      ));

      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
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
          // Neue Nachricht laden
          const { data: messageData } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (messageData) {
            // Sender-Informationen separat laden
            const { data: senderData } = await supabase
              .from('users')
              .select('id, email, first_name, last_name, role')
              .eq('id', messageData.sender_id)
              .single();

            const messageWithSender = {
              ...messageData,
              sender: senderData
            };

            setMessages(prev => [...prev, messageWithSender]);
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
          // Bearbeitete Nachricht laden
          const { data: messageData } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (messageData) {
            // Sender-Informationen separat laden
            const { data: senderData } = await supabase
              .from('users')
              .select('id, email, first_name, last_name, role')
              .eq('id', messageData.sender_id)
              .single();

            const messageWithSender = {
              ...messageData,
              sender: senderData
            };

            setMessages(prev => 
              prev.map(msg => msg.id === messageWithSender.id ? messageWithSender : msg)
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
