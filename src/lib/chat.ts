import { retrieveRelevantKnowledge } from "./retrieval";
import type { chatMessage } from "../types/chat";
import { generateAnswer } from "./groq";

// Combines knowledge retrieval + recent conversation history + the new
// question into one Groq call, and returns the generated answer.
export async function getChatResponse(
    question: string,
    recentHistory: chatMessage[] = []
): Promise<string>{
    const matches = await retrieveRelevantKnowledge(question);
    const contextChunks = matches.map((match) => {
        return match.content;
    });

    const answer = await generateAnswer(question , contextChunks, recentHistory);
    return answer;
}