import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { UserSelector } from './UserSelector';
import { Conversation } from '../../hooks/useConversations';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onStartConversation: (userIds: string[]) => Promise<void>;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onStartConversation,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSelector, setShowUserSelector] = useState(false);

  // Filter conversations based on search only
  const filteredConversations = conversations.filter(conversation => {
    return !searchTerm || 
      conversation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleStartConversation = async (userIds: string[]) => {
    await onStartConversation(userIds);
    setShowUserSelector(false);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
          <button
            onClick={() => setShowUserSelector(true)}
            className="p-2 text-gray-500 hover:text-kraatz-primary hover:bg-gray-100 rounded-lg transition-colors"
            title="Neue Unterhaltung starten"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Unterhaltungen durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kraatz-primary focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kraatz-primary"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? (
              <div>
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Keine Unterhaltungen gefunden</p>
                <p className="text-xs mt-1">Versuche einen anderen Suchbegriff</p>
              </div>
            ) : conversations.length === 0 ? (
              <div>
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium mb-2">Noch keine Unterhaltungen</p>
                <p className="text-xs mb-4">Starte deine erste Unterhaltung!</p>
                <button
                  onClick={() => setShowUserSelector(true)}
                  className="text-sm text-kraatz-primary hover:text-kraatz-primary/80 font-medium"
                >
                  Neue Unterhaltung starten
                </button>
              </div>
            ) : (
              <div>
                <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Keine Unterhaltungen in dieser Kategorie</p>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              onClick={() => onSelectConversation(conversation.id)}
            />
          ))
        )}
      </div>

      {/* User Selector Modal */}
      {showUserSelector && (
        <UserSelector
          onSelectUsers={handleStartConversation}
          onClose={() => setShowUserSelector(false)}
        />
      )}
    </div>
  );
};
