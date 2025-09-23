import React, { useState, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Conversation, ConversationParticipant } from '../../hooks/useConversations';
import { Message } from '../../hooks/useMessages';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  participants: ConversationParticipant[];
  loading?: boolean;
  hasMoreMessages?: boolean;
  onSendMessage: (content: string) => Promise<boolean>;
  onEditMessage: (messageId: string, newContent: string) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<boolean>;
  onLoadMoreMessages: () => void;
  onLeaveConversation?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  participants,
  loading = false,
  hasMoreMessages = false,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onLoadMoreMessages,
  onLeaveConversation
}) => {
  const [isTyping, setIsTyping] = useState(false);

  // Handle typing indicator (placeholder for future real-time typing)
  const handleTypingStart = () => {
    setIsTyping(true);
  };

  const handleTypingStop = () => {
    setIsTyping(false);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Willkommen im Chat</h3>
          <p className="text-sm text-gray-600 mb-4">
            Wähle eine Unterhaltung aus der Liste oder starte eine neue
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>💬 Chatte mit anderen Benutzern basierend auf deiner Rolle</p>
            <p>🔒 Alle Nachrichten sind sicher und verschlüsselt</p>
            <p>⚡ Real-time Updates für sofortige Kommunikation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        participants={participants}
        onLeaveConversation={onLeaveConversation}
      />

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMoreMessages}
        onLoadMore={onLoadMoreMessages}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-4 py-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>Jemand tippt...</span>
          </div>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        placeholder={`Nachricht an ${conversation.title || 'Unterhaltung'}...`}
      />
    </div>
  );
};
