'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { signOut } from '@/lib/auth';
import { SignInDialog } from './SignInDialog';

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
};

export function Sidebar({
  conversations,
  activeConversationId,
  onSwitchConversation,
  onNewChat,
}: SidebarProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

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

  const handleSignInSuccess = () => {
    setShowSignIn(false);
    checkUser();
  };

  return (
    <div className="flex flex-col h-full w-64 bg-gray-800 text-white">
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full border border-gray-500 rounded-lg py-2 text-m hover:bg-gray-800"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-gray-300 text-m px-2 py-4">No conversations yet.</p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSwitchConversation(conv.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate ${
              conv.id === activeConversationId ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
          >
            {conv.title || 'New Chat'}
          </button>
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
          <>
            <button
              onClick={() => setShowSignIn(!showSignIn)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm"
            >
              Sign In
            </button>

            {showSignIn && (
              <div className="absolute bottom-full left-3 right-3 mb-2 z-10">
                <SignInDialog onSuccess={handleSignInSuccess} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}