import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Message } from './Message';
import { Message as MessageType } from '../../hooks/useMessages';

interface MessageListProps {
  messages: MessageType[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onEditMessage?: (messageId: string, newContent: string) => Promise<boolean>;
  onDeleteMessage?: (messageId: string) => Promise<boolean>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  hasMore = false,
  onLoadMore,
  onEditMessage,
  onDeleteMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  // Scroll to bottom when new messages arrive (if user is near bottom)
  useEffect(() => {
    if (autoScroll && isNearBottom && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll, isNearBottom]);

  // Handle scroll events
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // User is near bottom if within 100px
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    setShowScrollToBottom(!nearBottom && messages.length > 0);

    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMore && onLoadMore && !loading) {
      onLoadMore();
    }
  };

  // Scroll to bottom manually
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScroll(true);
  };

  // Disable auto-scroll when user manually scrolls up
  const handleUserScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    if (distanceFromBottom > 100) {
      setAutoScroll(false);
    } else {
      setAutoScroll(true);
    }
  };

  // Show loading state
  if (loading && messages.length === 0) {
    console.log('📱 MessageList: Showing loading state', { loading, messagesCount: messages.length });
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
          <p className="text-lg font-medium mb-2">Nachrichten werden geladen...</p>
          <p className="text-sm">Einen Moment bitte</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Noch keine Nachrichten</p>
          <p className="text-sm">Starte die Unterhaltung mit einer Nachricht!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        onWheel={handleUserScroll}
        className="h-full overflow-y-auto p-4 space-y-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Load More Indicator */}
        {hasMore && (
          <div className="flex justify-center py-4">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Lade weitere Nachrichten...</span>
              </div>
            ) : (
              <button
                onClick={onLoadMore}
                className="text-sm text-kraatz-primary hover:text-kraatz-primary/80 font-medium"
              >
                Weitere Nachrichten laden
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showDateSeparator = prevMessage && 
            new Date(message.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString();

          return (
            <React.Fragment key={message.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex justify-center my-6">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {new Date(message.created_at).toLocaleDateString('de-DE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {/* Message */}
              <Message
                message={message}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
              />
            </React.Fragment>
          );
        })}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-kraatz-primary text-white p-2 rounded-full shadow-lg hover:bg-kraatz-primary/90 transition-colors z-10"
          title="Zu den neuesten Nachrichten"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Loading Overlay */}
      {loading && messages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Nachrichten werden geladen...</span>
          </div>
        </div>
      )}
    </div>
  );
};
