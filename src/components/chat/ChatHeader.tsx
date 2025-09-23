import React, { useState, useEffect } from 'react';
import { Users, MoreVertical } from 'lucide-react';
import { Conversation, ConversationParticipant } from '../../hooks/useConversations';
import { formatUserRole, getRoleColor } from '../../utils/chatPermissions';

interface ChatHeaderProps {
  conversation: Conversation | null;
  participants: ConversationParticipant[];
  onLeaveConversation?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  participants,
  onLeaveConversation
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  if (!conversation) {
    return (
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-center">
        <div className="text-gray-500 text-sm">Wähle eine Unterhaltung aus</div>
      </div>
    );
  }

  const otherParticipants = participants.filter(p => p.user?.id !== conversation.created_by);
  const isGroupChat = participants.length > 2;

  return (
    <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4">
      {/* Left Side - Conversation Info */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          conversation.type === 'support' 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isGroupChat ? (
            <Users className="w-5 h-5" />
          ) : otherParticipants[0]?.user ? (
            <span className="font-medium">
              {otherParticipants[0].user.first_name[0]?.toUpperCase()}
            </span>
          ) : (
            <Users className="w-5 h-5" />
          )}
        </div>

        {/* Title and Status */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">
            {conversation.title || 'Unbenannte Unterhaltung'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{participants.length} Teilnehmer</span>
            {conversation.type === 'support' && (
              <>
                <span>•</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Support
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2">

        {/* Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {onLeaveConversation && (
                  <button
                    onClick={() => {
                      onLeaveConversation();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Unterhaltung verlassen
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
