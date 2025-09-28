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
    getConversationParticipants,
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
    // TODO: Implement conversation selection
    console.log('Select conversation:', conversationId);
  };

  // Handle starting new conversation
  const handleStartConversation = async (userIds: string[]) => {
    // TODO: Implement conversation creation
    console.log('Start conversation with:', userIds);
  };

  // Handle leaving conversation
  const handleLeaveConversation = async () => {
    // TODO: Implement leave conversation
    console.log('Leave conversation');
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
        messages={[]}
        participants={participants}
        loading={loading}
        hasMoreMessages={false}
        onSendMessage={async () => false}
        onEditMessage={async () => false}
        onDeleteMessage={async () => false}
        onLoadMoreMessages={async () => {}}
        onLeaveConversation={handleLeaveConversation}
      />

      {/* Mobile Overlay (for responsive design) - only show on mobile when sidebar should be hidden */}
      {/* Removed problematic overlay that was blocking desktop interaction */}
    </div>
  );
};
