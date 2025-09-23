import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Users, MessageCircle } from 'lucide-react';
import { Conversation } from '../../hooks/useConversations';

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive = false,
  onClick
}) => {
  const hasUnread = conversation.unread_count > 0;

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
        isActive ? 'bg-kraatz-primary/10 border-r-4 border-r-kraatz-primary' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar/Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          conversation.type === 'support' 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {conversation.type === 'support' ? (
            <MessageCircle className="w-6 h-6" />
          ) : (
            <Users className="w-6 h-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Timestamp */}
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-sm font-medium truncate ${
              hasUnread ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {conversation.title || 'Unbenannte Unterhaltung'}
            </h3>
            {conversation.last_message_at && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatDistanceToNow(new Date(conversation.last_message_at), {
                  addSuffix: true,
                  locale: de
                })}
              </span>
            )}
          </div>

          {/* Last Message */}
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${
              hasUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}>
              {conversation.last_message || 'Keine Nachrichten'}
            </p>

            {/* Unread Badge */}
            {hasUnread && (
              <span className="flex-shrink-0 ml-2 bg-kraatz-primary text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            )}
          </div>

          {/* Conversation Type Badge */}
          <div className="flex items-center gap-2 mt-2">
            {conversation.type === 'support' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                Support
              </span>
            )}
            <span className="text-xs text-gray-500">
              {conversation.participant_count} Teilnehmer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
