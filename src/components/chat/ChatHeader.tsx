import React, { useState, useEffect } from 'react';
import { Users, MoreVertical, Phone, Video, Info } from 'lucide-react';
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
  const [showParticipants, setShowParticipants] = useState(false);

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
        {/* Call Actions (placeholder for future features) */}
        <button
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Anruf (bald verfügbar)"
          disabled
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Videoanruf (bald verfügbar)"
          disabled
        >
          <Video className="w-4 h-4" />
        </button>

        {/* Info Button */}
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Teilnehmer anzeigen"
        >
          <Info className="w-4 h-4" />
        </button>

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
                <button
                  onClick={() => {
                    setShowParticipants(!showParticipants);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Teilnehmer anzeigen
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                  disabled
                >
                  Stumm schalten (bald verfügbar)
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                  disabled
                >
                  Benachrichtigungen (bald verfügbar)
                </button>
                <hr className="my-1" />
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

      {/* Participants Sidebar */}
      {showParticipants && (
        <div className="absolute top-16 right-0 w-80 bg-white border-l border-gray-200 shadow-lg z-20 h-[calc(100vh-4rem)]">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Teilnehmer ({participants.length})</h3>
          </div>
          <div className="overflow-y-auto">
            {participants.map(participant => (
              <div key={participant.id} className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {participant.user?.first_name[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {participant.user?.first_name} {participant.user?.last_name}
                      </p>
                      {participant.user?.role && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(participant.user.role)}`}>
                          {formatUserRole(participant.user.role)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {participant.user?.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Beigetreten: {new Date(participant.joined_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
