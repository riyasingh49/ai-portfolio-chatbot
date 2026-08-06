import { embedText } from "./embeddings";
import { searchKnowledgeBase } from "@/db/knowledgeBase";

// Takes a raw user question, embeds it, and returns the most
// relevant chunks of personal knowledge to answer it.
export async function retrieveRelevantKnowledge(question: string){
    const questionEmbedding = await embedText(question);
    const match = await searchKnowledgeBase(questionEmbedding);

    return match;
}