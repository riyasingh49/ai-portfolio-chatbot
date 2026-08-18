import { ChatBox } from '@/components/ChatBox';
import { AuthButton } from '@/components/AuthButton';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl flex justify-end mb-2">
        <AuthButton />
      </div>
      <div className="w-full h-[80vh]">
        <ChatBox />
      </div>
    </main>
  );
}