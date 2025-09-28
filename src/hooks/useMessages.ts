import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChatUser } from '../utils/chatPermissions';
import { NotificationService } from '../services/notificationService';

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
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const MESSAGES_PER_PAGE = 50;
  const POLLING_INTERVAL = 2000; // 2 seconds

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
      
      // Update last message ID for polling
      if (newMessages.length > 0) {
        const latestMessage = reset ? newMessages[newMessages.length - 1] : newMessages[0];
        setLastMessageId(latestMessage.id);
      }
      
      console.log('📨 Messages loaded:', {
        conversationId,
        newMessagesCount: newMessages.length,
        reset,
        totalMessages: reset ? newMessages.length : messages.length + newMessages.length,
        lastMessageId: newMessages.length > 0 ? (reset ? newMessages[newMessages.length - 1].id : newMessages[0].id) : null
      });
    } catch (err) {
      console.error('❌ Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      setMessages([]); // Clear messages on error
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user, page, messages.length]);

  // Check for new messages (polling fallback)
  const checkForNewMessages = useCallback(async () => {
    if (!conversationId || !user || !lastMessageId) return;

    try {
      const { data: newMessagesData, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .gt('created_at', messages.length > 0 ? messages[messages.length - 1].created_at : new Date(0).toISOString())
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (newMessagesData && newMessagesData.length > 0) {
        console.log('🔄 Found new messages via polling:', newMessagesData.length);
        
        const newMessages: Message[] = [];
        for (const message of newMessagesData) {
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

        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id));
          const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
          return [...prev, ...uniqueNewMessages];
        });

        if (newMessages.length > 0) {
          setLastMessageId(newMessages[newMessages.length - 1].id);
        }
      }
    } catch (err) {
      console.error('❌ Error checking for new messages:', err);
    }
  }, [conversationId, user, lastMessageId, messages]);

  // Nachricht senden
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!conversationId || !user || !content.trim()) return false;

    try {
      console.log('📤 Sending message:', { conversationId, content: content.trim() });
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Message sent successfully:', data);
      
      // Create notifications for other participants immediately after sending
      try {
        console.log('🔔 Starting notification creation process...');
        console.log('🔔 Sender ID:', user.id);
        console.log('🔔 Conversation ID:', conversationId);
        
        // Get current user info
        const { data: senderData, error: senderError } = await supabase
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', user.id)
          .single();

        if (senderError) {
          console.error('❌ Error fetching sender data:', senderError);
          return true; // Don't fail message send
        }

        console.log('👤 Sender data:', senderData);

        // Get conversation participants (excluding sender)
        const { data: participants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('user_id, users(email, first_name, last_name)')
          .eq('conversation_id', conversationId)
          .neq('user_id', user.id);

        if (participantsError) {
          console.error('❌ Error fetching participants:', participantsError);
          return true; // Don't fail message send
        }

        console.log('👥 Participants found:', participants);

        // Create notifications for all other participants
        if (participants && senderData) {
          const senderName = `${senderData.first_name} ${senderData.last_name}`;
          
          // Create notifications for all participants
          const notificationPromises = participants.map(async (participant: any) => {
            try {
              const recipientEmail = (participant as any).users?.email || 'unknown';
              console.log('🔔 Creating chat notification for user:', {
                id: participant.user_id,
                email: recipientEmail
              });
              
              // Method 1: Direct database insert with detailed logging
              const notificationData = {
                user_id: participant.user_id,
                title: '💬 Neue Chat-Nachricht',
                message: `${senderName}: ${content.length > 50 ? content.substring(0, 50) + '...' : content}`,
                type: 'info' as const,
                related_case_study_id: conversationId,
                read: false
              };
              
              console.log('🔔 Notification data for', recipientEmail, ':', notificationData);
              
              const { data: notificationResult, error: directError } = await supabase
                .from('notifications')
                .insert(notificationData)
                .select()
                .single();

              if (directError) {
                console.error('❌ Direct notification creation failed for', recipientEmail, ':', directError);
                
                // Method 2: Fallback to NotificationService
                console.log('🔄 Trying fallback method for', recipientEmail, '...');
                const fallbackResult = await NotificationService.createChatNotification(
                  participant.user_id,
                  senderName,
                  content.trim(),
                  conversationId
                );
                console.log('🔔 Fallback result for', recipientEmail, ':', fallbackResult);
              } else {
                console.log('✅ Direct notification created successfully for', recipientEmail, ':', notificationResult);
                
                // Verify the notification was actually created
                const { data: verification } = await supabase
                  .from('notifications')
                  .select('*')
                  .eq('id', notificationResult.id)
                  .single();
                
                console.log('✅ Verification - notification exists for', recipientEmail, ':', verification);
              }
            } catch (error) {
              console.error('❌ Error creating notification for participant:', participant.user_id, error);
            }
          });

          await Promise.all(notificationPromises);
          console.log('🔔 Chat notifications processed for', participants.length, 'participants');
        }
      } catch (notificationError) {
        console.error('❌ Error creating chat notifications:', notificationError);
        // Don't fail the message send if notifications fail
      }
      
      return true;
    } catch (err) {
      console.error('❌ Error sending message:', err);
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

  // Setup polling interval
  useEffect(() => {
    if (!conversationId || !user) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    console.log('🔄 Setting up polling for conversation:', conversationId);
    
    const interval = setInterval(() => {
      checkForNewMessages();
    }, POLLING_INTERVAL);
    
    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [conversationId, user, checkForNewMessages, pollingInterval]);

  // Real-time Subscription für neue Nachrichten (with fallback to polling)
  useEffect(() => {
    if (!conversationId || !user) return;

    console.log('🔔 Setting up real-time subscription for conversation:', conversationId);

    const messageSubscription = supabase
      .channel(`messages_${conversationId}_${user.id}`) // Unique channel per user/conversation
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload: any) => {
          console.log('📨 New message received via subscription:', payload);
          
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

            console.log('✅ Adding new message to state via real-time:', messageWithSender);
            
            // Prüfen ob die Nachricht bereits existiert (um Duplikate zu vermeiden)
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === messageWithSender.id);
              if (exists) {
                console.log('⚠️ Message already exists, skipping');
                return prev;
              }
              setLastMessageId(messageWithSender.id);
              return [...prev, messageWithSender];
            });

            // Note: Chat notifications are now created directly in sendMessage function
            // to ensure they are always created reliably, not just via real-time subscription
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
        async (payload: any) => {
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
        (payload: any) => {
          setMessages(prev => 
            prev.filter(msg => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe((status: any) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to real-time messages');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from real-time messages');
      messageSubscription.unsubscribe();
    };
  }, [conversationId, user]);

  // Nachrichten laden wenn Konversation wechselt
  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      setPage(0);
      setHasMore(true);
      setError(null);
      setLastMessageId(null);
      fetchMessages(true);
    } else {
      // Reset state when no conversation is selected
      setMessages([]);
      setLoading(false);
      setError(null);
      setHasMore(false);
      setLastMessageId(null);
      
      // Clear polling interval
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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
