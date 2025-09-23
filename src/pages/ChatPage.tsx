import React from 'react';
// import { ChatLayout } from '../components/chat/ChatLayout';

export const ChatPage: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Chat Feature</h2>
        <p className="text-gray-600">Chat-Feature wird geladen...</p>
        <p className="text-sm text-gray-500 mt-2">Temporär deaktiviert für Debugging</p>
      </div>
    </div>
  );
};
