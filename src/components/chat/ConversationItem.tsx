import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Users, MessageCircle } from 'lucide-react';
import { Conversation, ConversationParticipant } from '../../hooks/useConversations';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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
  const [chatPartnerName, setChatPartnerName] = useState<string>('Laden...');
  const hasUnread = conversation.unread_count > 0;

  // Load conversation participants and determine chat partner name
  useEffect(() => {
    const loadChatPartner = async () => {
      if (!user?.id) return;

      try {
        // Get participants for this conversation
        const { data: participantsData, error } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            users!inner (
              id,
              email,
              first_name,
              last_name,
              role
            )
          `)
          .eq('conversation_id', conversation.id);

        if (error) {
          console.error('Error loading participants:', error);
          setChatPartnerName('Unbekannt');
          return;
        }

        // Find the other participant (not the current user)
        const otherParticipant = participantsData?.find(p => p.user_id !== user.id);
        
        if (otherParticipant?.users && Array.isArray(otherParticipant.users) && otherParticipant.users.length > 0) {
          const partner = otherParticipant.users[0];
          setChatPartnerName(`${partner.first_name} ${partner.last_name}`);
        } else if (otherParticipant?.users && !Array.isArray(otherParticipant.users)) {
          const partner = otherParticipant.users as any;
          setChatPartnerName(`${partner.first_name} ${partner.last_name}`);
        } else {
          setChatPartnerName('Unbekannte Person');
        }
      } catch (error) {
        console.error('Error loading chat partner:', error);
        setChatPartnerName('Fehler beim Laden');
      }
    };

    loadChatPartner();
  }, [conversation.id, user?.id]);
  

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
            {chatPartnerName}
          </h3>
        </div>
      </div>
    </div>
  );
};
