import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Users, MessageCircle } from 'lucide-react';
import { Conversation } from '../../hooks/useConversations';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user } = useAuth();
  const hasUnread = conversation.unread_count > 0;

  // Generate chat partner name - show who the user is chatting with
  const getChatPartnerName = () => {
    // For instructor chatting with admin, show "Admin"
    // For student chatting with admin, show "Admin" 
    // This is a simplified version - in a real app you'd get this from participants data
    return 'Admin';
  };
  

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

        {/* Content - Only chat partner name */}
        <div className="flex-1 min-w-0 flex items-center">
          <h3 className={`text-sm font-medium ${
            hasUnread ? 'text-gray-900' : 'text-gray-700'
          }`}>
            {getChatPartnerName()}
          </h3>
        </div>
      </div>
    </div>
  );
};
