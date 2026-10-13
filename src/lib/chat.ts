import { retrieveRelevantKnowledge } from "./retrieval";
import type { chatMessage } from "../types/chat";
import { generateAnswerStream, StreamEvent } from "./groq";

export async function* getChatResponseStream(
    question: string,
    recentHistory: chatMessage[] = []
  ): AsyncGenerator<StreamEvent> {
    const matches = await retrieveRelevantKnowledge(question);
    const contextChunks = matches.map((match) => match.content);
  
    yield* generateAnswerStream(question, contextChunks, recentHistory);
  }