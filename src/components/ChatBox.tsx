'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuthListener } from '@/hooks/useAuthListener';
import { SignInDialog } from './SignInDialog';

export function ChatBox() {
  const { messages, sendMessage, isLoading, guestLimitReached, onSignedIn } = useChat();
  const [input, setInput] = useState('');

  useAuthListener(onSignedIn);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto border rounded-lg overflow-hidden bg-gray-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500">
            Hi! Let&apos;s discuss Riya&apos;s professional background — feel free to ask me anything about her work, projects, or skills.
          </p>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={message.role === 'user' ? 'text-right' : 'text-left'}
          >
            <span
              className={`inline-block px-3 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.content}
            </span>
          </div>
        ))}

        {isLoading && <p className="text-gray-400 text-sm">Thinking...</p>}
      </div>

      {guestLimitReached ? (
        <div className="p-4 border-t">
          <SignInDialog onSuccess={onSignedIn} />
        </div>
      ) : (
        <div className="flex gap-2 p-4">
          <input
            className="text-gray-600 flex-1 border rounded px-3 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}