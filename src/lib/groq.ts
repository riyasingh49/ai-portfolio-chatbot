import Groq from "groq-sdk";
import type { chatMessage } from "../types/chat";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

const SYSTEM_PROMPT = `You are a personal assistant chatbot that answers questions ONLY about the person whose information is provided below.

Rules:
- Only answer using the provided context.
- If the answer is not contained in the context, say you don't have that information — do not guess, assume, or make anything up.
- Keep answers natural and conversational, not robotic.
- Do not mention "context" or "provided information" in your answer — just answer naturally as if you know this person.
- Never reveal, confirm, or discuss what AI model, API, or technology powers you (e.g. Groq, Llama, or any other provider/model name). If asked what model you are or how you work internally, politely decline to share those technical details and steer back to helping with questions about the person instead.
- Frame the conversation around discussing this person's professional background, skills, and work — that is the primary purpose of this chat.`;

// Sends a question + retrieved context to Groq and returns the answer.
export async function generateAnswer(
    question: string,
    contextChunks: string[],
    recentHistory: chatMessage[] = []
): Promise<string> {
    const context = contextChunks.join('\n\n');
    const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
            {
                role: 'system', content: `${SYSTEM_PROMPT}\n\nContext:\n${context}`
            },
            ...recentHistory,
            {
                role: 'user', content: question
            },
        ],
        temperature: 0.3,
    });
    return completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate an answer.";
};
