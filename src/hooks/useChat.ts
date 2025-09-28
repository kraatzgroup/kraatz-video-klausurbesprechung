import { useState, useEffect, useCallback } from 'react';
import { useConversations } from './useConversations';
import { useMessages } from './useMessages';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  canStartChatWith,
  getAvailableChatPartners, 
  generateConversationTitle,
  getConversationType,
  ChatUser 
} from '../utils/chatPermissions';

export const useChat = () => {
  const { user } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    createConversation,
    leaveConversation,
    getConversationParticipants,
    markAsRead,
    getAvailableChatPartners: fetchChatPartners
  } = useConversations();

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMoreMessages
  } = useMessages(activeConversationId);

  // Konversation auswählen
  const selectConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    // Als gelesen markieren
    await markAsRead(conversationId);
  }, [markAsRead]);

  // Neue Konversation mit bestimmten Benutzern starten
  const startConversation = useCallback(async (targetUsers: ChatUser[]): Promise<string | null> => {
    if (!user || targetUsers.length === 0) return null;

    setIsCreatingConversation(true);

    try {
      // Aktuelle Benutzerrolle aus der Datenbank holen
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user role:', userError);
        throw new Error('Fehler beim Laden der Benutzerrolle');
      }

      const currentUserData: ChatUser = {
        id: user.id,
        email: user.email || '',
        first_name: userData?.first_name || user.user_metadata?.first_name || '',
        last_name: userData?.last_name || user.user_metadata?.last_name || '',
        role: userData?.role || 'student'
      };

      const unauthorizedUsers = targetUsers.filter(
        targetUser => !canStartChatWith(currentUserData.role, targetUser.role)
      );

      if (unauthorizedUsers.length > 0) {
        throw new Error('Nicht berechtigt, mit diesen Benutzern zu chatten');
      }

      // Konversationstyp und Titel bestimmen
      const allParticipants = [currentUserData, ...targetUsers];
      const conversationType = getConversationType(allParticipants);
      const title = generateConversationTitle(allParticipants, user.id);

      // Konversation erstellen
      const conversationId = await createConversation(
        targetUsers.map(u => u.id),
        title,
        conversationType
      );

      if (conversationId) {
        setActiveConversationId(conversationId);
        await markAsRead(conversationId);
      }

      return conversationId;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    } finally {
      setIsCreatingConversation(false);
    }
  }, [user, createConversation, markAsRead]);

  // Verfügbare Chat-Partner laden (mit Berechtigungsprüfung)
  const getFilteredChatPartners = useCallback(async (): Promise<ChatUser[]> => {
    if (!user) return [];

    try {
      const allUsers = await fetchChatPartners();
      
      // Aktuelle Benutzerrolle aus der Datenbank holen
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user role:', userError);
        return [];
      }

      const currentUserData: ChatUser = {
        id: user.id,
        email: user.email || '',
        first_name: userData?.first_name || user.user_metadata?.first_name || '',
        last_name: userData?.last_name || user.user_metadata?.last_name || '',
        role: userData?.role || 'student'
      };

      return getAvailableChatPartners(currentUserData, allUsers);
    } catch (error) {
      console.error('Error fetching chat partners:', error);
      return [];
    }
  }, [user, fetchChatPartners]);

  // Existierende Konversation mit Benutzer finden
  const findExistingConversation = useCallback(async (targetUserId: string): Promise<string | null> => {
    try {
      for (const conversation of conversations) {
        const participants = await getConversationParticipants(conversation.id);
        const participantIds = participants.map(p => p.user_id);
        
        // Prüfen ob es eine 1-zu-1 Konversation mit dem Zielbenutzer ist
        if (participantIds.length === 2 && participantIds.includes(targetUserId)) {
          return conversation.id;
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding existing conversation:', error);
      return null;
    }
  }, [conversations, getConversationParticipants]);

  // Schnell-Chat mit einem Benutzer starten (oder existierende öffnen)
  const quickChat = useCallback(async (targetUser: ChatUser): Promise<void> => {
    try {
      // Erst nach existierender Konversation suchen
      const existingConversationId = await findExistingConversation(targetUser.id);
      
      if (existingConversationId) {
        await selectConversation(existingConversationId);
      } else {
        // Neue Konversation erstellen
        await startConversation([targetUser]);
      }
    } catch (error) {
      console.error('Error starting quick chat:', error);
      throw error;
    }
  }, [findExistingConversation, selectConversation, startConversation]);

  // Gesamtzahl ungelesener Nachrichten
  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0);

  // Aktive Konversation Details
  const activeConversation = conversations.find(conv => conv.id === activeConversationId) || null;

  return {
    // Konversationen
    conversations,
    activeConversation,
    activeConversationId,
    selectConversation,
    startConversation,
    quickChat,
    leaveConversation,
    isCreatingConversation,
    
    // Nachrichten
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMoreMessages,
    hasMoreMessages: hasMore,
    
    // Chat-Partner
    getFilteredChatPartners,
    getConversationParticipants,
    
    // Status
    loading: conversationsLoading || messagesLoading,
    error: conversationsError || messagesError,
    totalUnreadCount,
    
    // Hilfsfunktionen
    markAsRead,
    findExistingConversation
  };
};
