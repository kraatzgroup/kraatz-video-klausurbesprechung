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
        // First get participants for this conversation
        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation.id);

        console.log('🔍 Participants data:', participantsData);
        console.log('🔍 Current user ID:', user.id);

        if (participantsError) {
          console.error('Error loading participants:', participantsError);
          setChatPartnerName('Fehler: ' + participantsError.message);
          return;
        }

        // Find the other participant (not the current user)
        const otherParticipantId = participantsData?.find((p: any) => p.user_id !== user.id)?.user_id;
        
        console.log('🔍 Other participant ID:', otherParticipantId);
        
        if (!otherParticipantId) {
          console.log('🔍 No other participant found');
          setChatPartnerName('Keine anderen Teilnehmer');
          return;
        }

        // Now get the user data for the other participant
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, role')
          .eq('id', otherParticipantId)
          .single();

        console.log('🔍 User data:', userData);

        if (userError) {
          console.error('Error loading user data:', userError);
          setChatPartnerName('Fehler beim Laden der Benutzerdaten');
          return;
        }

        if (userData) {
          setChatPartnerName(`${userData.first_name} ${userData.last_name}`);
        } else {
          setChatPartnerName('Benutzerdaten nicht gefunden');
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
