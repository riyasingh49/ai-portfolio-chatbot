import { embedText } from "./embeddings";
import { searchKnowledgeBase } from "@/db/knowledgeBase";

// Takes a raw user question, embeds it, and returns the most
// relevant chunks of personal knowledge to answer it.
export async function retrieveRelevantKnowledge(question: string){
    const questionEmbedding = await embedText(question);
    const match = await searchKnowledgeBase(questionEmbedding);

    console.log('QUESTION:', question);
    console.log('MATCHES FOUND:', match.length);
    console.log('MATCHES:', JSON.stringify(match, null, 2));

    console.log('QUESTION:', question);
  match.forEach((m) => {
    console.log(`similarity=${m.similarity.toFixed(3)} | ${m.content.slice(0, 60)}...`);
  });
    return match;
}