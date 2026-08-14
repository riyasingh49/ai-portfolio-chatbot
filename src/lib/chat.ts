import { retrieveRelevantKnowledge } from "./retrieval";
import type { chatMessage } from "../types/chat";
import { generateAnswerStream } from "./groq";

// Non-streaming — kept for any future use case that just needs the final text.
// import { generateAnswer } from "./groq";

// // Combines knowledge retrieval + recent conversation history + the new
// // question into one Groq call, and returns the generated answer.
// export async function getChatResponse(
//     question: string,
//     recentHistory: chatMessage[] = []
// ): Promise<string>{
//     const matches = await retrieveRelevantKnowledge(question);
//     const contextChunks = matches.map((match) => {
//         return match.content;
//     });

//     const answer = await generateAnswer(question , contextChunks, recentHistory);
//     return answer;
// }

export async function* getChatResponseStream(
    question: string,
    recentHistory: chatMessage[] = []
  ): AsyncGenerator<string> {
    const matches = await retrieveRelevantKnowledge(question);
    const contextChunks = matches.map((match) => match.content);
  
    yield* generateAnswerStream(question, contextChunks, recentHistory);
  }