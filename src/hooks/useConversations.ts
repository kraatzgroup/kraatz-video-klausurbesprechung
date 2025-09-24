import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChatUser } from '../utils/chatPermissions';

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  type: 'support' | 'group';
  title: string | null;
  created_by: string;
  participant_count: number;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  user?: ChatUser;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Konversationen laden
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('conversation_details')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Neue Konversation erstellen
  const createConversation = useCallback(async (
    participantIds: string[],
    title?: string,
    type: 'support' | 'group' = 'group'
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Konversation erstellen
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          title,
          type,
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Teilnehmer hinzufügen (inklusive Ersteller)
      const allParticipantIds = [user.id, ...participantIds.filter(id => id !== user.id)];
      const participants = allParticipantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId
      }));

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Konversationen neu laden
      await fetchConversations();

      return conversation.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  }, [user, fetchConversations]);

  // Konversation verlassen
  const leaveConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Konversationen neu laden
      await fetchConversations();
      return true;
    } catch (err) {
      console.error('Error leaving conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave conversation');
      return false;
    }
  }, [user, fetchConversations]);

  // Teilnehmer einer Konversation laden
  const getConversationParticipants = useCallback(async (conversationId: string): Promise<ConversationParticipant[]> => {
    try {
      // First get participants
      const { data: participantsData, error } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId);

      if (error) throw error;

      // Then get user info for each participant
      const participants: ConversationParticipant[] = [];
      if (participantsData) {
        for (const participant of participantsData) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, role')
            .eq('id', participant.user_id)
            .single();

          participants.push({
            ...participant,
            user: userData || {
              id: participant.user_id,
              email: 'Unknown',
              first_name: 'Unknown',
              last_name: 'User',
              role: 'student'
            }
          });
        }
      }

      return participants;
    } catch (err) {
      console.error('Error fetching participants:', err);
      return [];
    }
  }, []);

  // Als gelesen markieren
  const markAsRead = useCallback(async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Lokale Konversation aktualisieren
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [user]);

  // Verfügbare Chat-Partner laden
  const getAvailableChatPartners = useCallback(async (): Promise<ChatUser[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .neq('id', user.id);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching chat partners:', err);
      return [];
    }
  }, [user]);

  // Real-time Subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up conversation subscriptions for user:', user.id);

    // Konversationen bei Änderungen neu laden
    const conversationSubscription = supabase
      .channel(`conversations_${user.id}`) // Unique channel per user
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload: any) => {
          console.log('📝 Conversation change detected:', payload);
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants'
        },
        (payload: any) => {
          console.log('👥 Participant change detected:', payload);
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload: any) => {
          console.log('💬 New message detected, updating conversations:', payload);
          // Refresh conversations to update last_message and unread counts
          fetchConversations();
        }
      )
      .subscribe((status: any) => {
        console.log('📡 Conversation subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to conversation changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to conversation changes');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from conversation changes');
      conversationSubscription.unsubscribe();
    };
  }, [user, fetchConversations]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    createConversation,
    leaveConversation,
    getConversationParticipants,
    markAsRead,
    getAvailableChatPartners,
    refetch: fetchConversations
  };
};
