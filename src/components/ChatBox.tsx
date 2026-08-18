'use client';

import { useState } from 'react';
import { SignInDialog } from './SignInDialog';
import ReactMarkdown from 'react-markdown';
import type { chatMessage } from '@/types/chat';

type ChatBoxProps = {
  messages: chatMessage[];
  sendMessage: (question: string) => void;
  isLoading: boolean;
  guestLimitReached: boolean;
  onSignedIn: () => void;
};

export function ChatBox({
  messages,
  sendMessage,
  isLoading,
  guestLimitReached,
  onSignedIn,
}: ChatBoxProps) {
  const [input, setInput] = useState('');

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
    <div className="flex flex-col h-full bg-gray-50 w-full">
      <div className="flex-1 overflow-y-auto p-8 space-y-3  w-full">
        {messages.length === 0 && (
          <p className="text-gray-500">
            Hi! Let&apos;s discuss Riya&apos;s professional background — feel free to ask me anything about her work, projects, or skills.
          </p>
        )}

{messages.map((message, index) => (
  <div
    key={index}
    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
  >
    <span
      className={`inline-block px-3 py-2 rounded-lg text-left max-w-[80%] ${
        message.role === 'user'
          ? 'bg-gray-600 text-white'
          : 'bg-gray-200 text-gray-900'
      }`}
    >
      {message.role === 'assistant' ? (
<div className="text-left">
  <ReactMarkdown
    components={{
      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      ul: ({ children }) => <ul className="list-disc pl-5 mb-1">{children}</ul>,
      li: ({ children }) => <li className="mb-0.5">{children}</li>,
    }}
  >
    {message.content.trim()}
  </ReactMarkdown>
</div>
) : (
  message.content
)}
    </span>
  </div>
))}

        {isLoading && <p className="text-gray-400 text-sm">Thinking...</p>}
      </div>

      {guestLimitReached ? (
        <div className="p-4 border-t w-full">
          <SignInDialog onSuccess={onSignedIn} />
        </div>
      ) : (
        <div className="flex gap-2 p-4 border-t w-full">
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
            className="bg-blue-950 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}