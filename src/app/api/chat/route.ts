import { getOrCreateSession } from "@/db/conversations";
import { getRecentMessage, saveMessage } from "@/db/messages";
import { getChatResponseStream } from "@/lib/chat";

export async function POST(request:Request) {
    const{sessionId, question} = await request.json();
    
    const conversationId = await getOrCreateSession(sessionId);
    const recentHistory = await getRecentMessage(conversationId);
     let fullAnswer = ' ';
     const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder();

            for await (const chunk of getChatResponseStream(question, recentHistory)){
                fullAnswer += chunk;
                controller.enqueue(encoder.encode(chunk));
            }

            await saveMessage(conversationId, question, fullAnswer );

            controller.close();
        },
     });

     return new Response(stream, {
        headers:{
            'Content-type': 'text/plain; charset=utf-8',
            'X-conversation-Id': conversationId,
        },
     });
}