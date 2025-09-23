import React, { useState } from 'react';
// import { formatDistanceToNow } from 'date-fns';
// import { de } from 'date-fns/locale';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Message as MessageType } from '../../hooks/useMessages';
import { useAuth } from '../../contexts/AuthContext';
import { canDeleteMessage, canEditMessage, formatUserRole, getRoleColor } from '../../utils/chatPermissions';

interface MessageProps {
  message: MessageType;
  onEdit?: (messageId: string, newContent: string) => Promise<boolean>;
  onDelete?: (messageId: string) => Promise<boolean>;
}

export const Message: React.FC<MessageProps> = ({ message, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnMessage = user?.id === message.sender_id;
  const isSystemMessage = message.message_type === 'system';

  const handleEdit = async () => {
    if (!onEdit || !editContent.trim()) return;

    const success = await onEdit(message.id, editContent.trim());
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    const success = await onDelete(message.id);
    if (!success) {
      setIsDeleting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Sender Info */}
        {!isOwnMessage && message.sender && (
          <div className="flex items-center mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium mr-2">
              {message.sender.first_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {message.sender.first_name} {message.sender.last_name}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(message.sender.role)}`}>
                {formatUserRole(message.sender.role)}
              </span>
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative group ${
            isOwnMessage
              ? 'bg-kraatz-primary text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          } rounded-lg px-4 py-2 shadow-sm`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Message Content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full p-2 border border-gray-300 rounded resize-none text-gray-900 focus:ring-2 focus:ring-kraatz-primary focus:border-transparent"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleEdit}
                  className="text-xs px-2 py-1 bg-kraatz-primary text-white rounded hover:bg-kraatz-primary/90"
                >
                  Speichern
                </button>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
              {message.edited_at && (
                <span className={`text-xs ml-2 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                  (bearbeitet)
                </span>
              )}
            </div>
          )}

          {/* Actions Menu */}
          {showActions && !isEditing && (user?.user_metadata?.role === 'admin' || isOwnMessage) && (
            <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg px-1 py-1`}>
              {canEditMessage(message.sender_id, user?.id || '') && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              {canDeleteMessage(user?.user_metadata?.role || 'student', message.sender_id, user?.id || '') && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  title="Löschen"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {new Date(message.created_at).toLocaleString('de-DE')}
        </div>
      </div>
    </div>
  );
};
