import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<boolean>;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Nachricht schreiben..."
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emojiData.emoji + message.slice(end);
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      const success = await onSendMessage(message.trim());
      if (success) {
        setMessage('');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Hier könnte später File-Upload-Funktionalität hinzugefügt werden
    // Für jetzt nur Text-Paste erlauben
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-3">
        {/* File Upload Button (für zukünftige Erweiterung) */}
        <button
          type="button"
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Datei anhängen (bald verfügbar)"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Emoji Button */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Emoji hinzufügen"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={320}
                height={400}
                searchDisabled={false}
                skinTonesDisabled={true}
                previewConfig={{
                  showPreview: false
                }}
              />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-kraatz-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Character count (optional) */}
          {message.length > 500 && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || isSending || disabled}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            message.trim() && !isSending && !disabled
              ? 'bg-kraatz-primary text-white hover:bg-kraatz-primary/90'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Nachricht senden (Enter)"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Typing hint */}
      <div className="mt-2 text-xs text-gray-500">
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> zum Senden, 
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Shift+Enter</kbd> für neue Zeile
      </div>
    </div>
  );
};
