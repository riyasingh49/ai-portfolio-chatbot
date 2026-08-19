'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase-client';
import { signOut } from '@/lib/auth';

type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
};

type SidebarProps = {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSwitchConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
};

export function Sidebar({
  conversations,
  activeConversationId,
  onSwitchConversation,
  onNewChat,
  onDeleteChat,
}: SidebarProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    setEmail(user?.email ?? null);
  }, []);

  useEffect(() => {
    checkUser();
    const { data: listener } = supabaseClient.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => listener.subscription.unsubscribe();
  }, [checkUser]);

  const handleSignOut = async () => {
    await signOut();
    setEmail(null);
    setShowProfileMenu(false);
  };

  const handleDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Delete this chat? This cannot be undone.')) {
      onDeleteChat(conversationId);
    }
  };

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900 text-white">
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full border border-gray-600 rounded-lg py-2 text-sm hover:bg-gray-800"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-gray-500 text-sm px-2 py-4">No conversations yet.</p>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center rounded-lg ${
              conv.id === activeConversationId ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
          >
            <button
              onClick={() => onSwitchConversation(conv.id)}
              className="flex-1 text-left px-3 py-2 text-sm truncate"
            >
              {conv.title || 'New Chat'}
            </button>
            <button
              onClick={(e) => handleDelete(e, conv.id)}
              className="opacity-0 group-hover:opacity-100 px-2 py-2 text-gray-400 hover:text-red-400"
              aria-label="Delete chat"
              title="Delete chat"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div className="relative border-t border-gray-700 p-3">
        {email ? (
          <>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-2 text-left text-sm hover:bg-gray-800 rounded-lg px-2 py-2"
            >
              <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium">
                {email[0].toUpperCase()}
              </span>
              <span className="truncate">{email}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </div>
            )}
          </>
        ) : (
          <Link
            href="/login"
            className="w-full block text-center bg-blue-600 text-white py-2 rounded-lg text-sm"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}