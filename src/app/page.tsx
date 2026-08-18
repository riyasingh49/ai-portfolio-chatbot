'use client';

import { useChat } from '@/hooks/useChat';
import { useAuthListener } from '@/hooks/useAuthListener';
import { Sidebar } from '@/components/Sidebar';
import { ChatBox } from '@/components/ChatBox';
import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  const {
    messages,
    sendMessage,
    isLoading,
    guestLimitReached,
    onSignedIn,
    conversations,
    activeConversationId,
    switchConversation,
    startNewChat,
  } = useChat();

  useAuthListener(onSignedIn);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSwitchConversation={switchConversation}
        onNewChat={startNewChat}
      />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          <ChatBox
            messages={messages}
            sendMessage={sendMessage}
            isLoading={isLoading}
            guestLimitReached={guestLimitReached}
            onSignedIn={onSignedIn}
          />
        </div>
      </div>
    </div>
  );
}