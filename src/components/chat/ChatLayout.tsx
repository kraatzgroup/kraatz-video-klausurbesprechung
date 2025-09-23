import React, { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import { ChatUser } from '../../utils/chatPermissions';

export const ChatLayout: React.FC = () => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  
  const {
    conversations,
    activeConversation,
    activeConversationId,
    selectConversation,
    startConversation,
    leaveConversation,
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMoreMessages,
    hasMoreMessages,
    getConversationParticipants,
    loading,
    error,
    totalUnreadCount
  } = useChat();

  // Load participants when active conversation changes
  useEffect(() => {
    const loadParticipants = async () => {
      if (activeConversationId) {
        const participantData = await getConversationParticipants(activeConversationId);
        setParticipants(participantData);
      } else {
        setParticipants([]);
      }
    };

    loadParticipants();
  }, [activeConversationId, getConversationParticipants]);

  // Handle conversation selection
  const handleSelectConversation = async (conversationId: string) => {
    await selectConversation(conversationId);
  };

  // Handle starting new conversation
  const handleStartConversation = async (userIds: string[]) => {
    if (!user) return;

    try {
      // Convert user IDs to ChatUser objects (simplified)
      const targetUsers: ChatUser[] = userIds.map(id => ({
        id,
        email: '',
        first_name: '',
        last_name: '',
        role: 'student' // This would normally be fetched from the database
      }));

      await startConversation(targetUsers);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Handle leaving conversation
  const handleLeaveConversation = async () => {
    if (activeConversationId) {
      const success = await leaveConversation(activeConversationId);
      if (success) {
        // Conversation will be removed from list automatically
      }
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Fehler beim Laden des Chats</h3>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-100">
      {/* Conversation List Sidebar */}
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onStartConversation={handleStartConversation}
        loading={loading}
      />

      {/* Main Chat Area */}
      <ChatWindow
        conversation={activeConversation}
        messages={messages}
        participants={participants}
        loading={loading}
        hasMoreMessages={hasMoreMessages}
        onSendMessage={sendMessage}
        onEditMessage={editMessage}
        onDeleteMessage={deleteMessage}
        onLoadMoreMessages={loadMoreMessages}
        onLeaveConversation={handleLeaveConversation}
      />

      {/* Mobile Overlay (for responsive design) */}
      {activeConversationId && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}
    </div>
  );
};
