import { ChatBox } from '@/components/ChatBox';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-300 p-4">
      
      <div className="w-full h-[85vh]">
      {/* <h1>AI Friend</h1> */}
        <ChatBox />
      </div>
    </main>
  );
}