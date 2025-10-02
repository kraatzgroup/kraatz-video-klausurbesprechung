import React, { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { useChat } from '../../hooks/useChat';
// import { useAuth } from '../../contexts/AuthContext';
// import { ChatUser } from '../../utils/chatPermissions';

export const ChatLayout: React.FC = () => {
  // const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  
  const {
    conversations,
    activeConversation,
    selectConversation,
    startConversation,
    leaveConversation,
    getConversationParticipants,
    getFilteredChatPartners,
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMoreMessages,
    hasMoreMessages,
    loading,
    error
    // totalUnreadCount - unused for now
  } = useChat();

  // Load participants when active conversation changes
  useEffect(() => {
    const loadParticipants = async () => {
      if (activeConversation) {
        const participantData = await getConversationParticipants(activeConversation.id);
        setParticipants(participantData);
      } else {
        setParticipants([]);
      }
    };

    loadParticipants();
  }, [activeConversation, getConversationParticipants]);

  // Handle conversation selection
  const handleSelectConversation = async (conversationId: string) => {
    try {
      await selectConversation(conversationId);
      console.log('✅ Conversation selected:', conversationId);
    } catch (error) {
      console.error('❌ Error selecting conversation:', error);
    }
  };

  // Handle starting new conversation
  const handleStartConversation = async (userIds: string[]) => {
    try {
      console.log('🚀 Starting conversation with users:', userIds);
      
      // Get user data for the selected user IDs
      const chatPartners = await getFilteredChatPartners();
      const selectedUsers = chatPartners.filter(user => userIds.includes(user.id));
      
      console.log('👥 Selected chat partners:', selectedUsers);
      
      if (selectedUsers.length > 0) {
        const conversationId = await startConversation(selectedUsers);
        if (conversationId) {
          console.log('✅ Conversation created successfully:', conversationId);
        }
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
    }
  };

  // Handle leaving conversation
  const handleLeaveConversation = async () => {
    if (!activeConversation) return;
    
    try {
      console.log('🚪 Leaving conversation:', activeConversation.id);
      
      // Show confirmation dialog
      const confirmed = window.confirm(
        'Möchtest du diese Unterhaltung wirklich verlassen? Du kannst sie später nicht mehr einsehen.'
      );
      
      if (!confirmed) return;
      
      const success = await leaveConversation(activeConversation.id);
      
      if (success) {
        console.log('✅ Successfully left conversation');
        // The conversation list will be automatically updated via the hook
        // No need to manually clear activeConversation as it will be removed from the list
      } else {
        console.error('❌ Failed to leave conversation');
        alert('Fehler beim Verlassen der Unterhaltung. Bitte versuche es erneut.');
      }
    } catch (error) {
      console.error('❌ Error leaving conversation:', error);
      alert('Fehler beim Verlassen der Unterhaltung. Bitte versuche es erneut.');
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
        activeConversationId={activeConversation?.id || ''}
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

      {/* Mobile Overlay (for responsive design) - only show on mobile when sidebar should be hidden */}
      {/* Removed problematic overlay that was blocking desktop interaction */}
    </div>
  );
};
