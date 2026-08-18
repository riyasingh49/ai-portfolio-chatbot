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
- Frame the conversation around discussing this person's professional background, skills, and work — that is the primary purpose of this chat.
- When stating job titles, designations, degrees, or specific factual labels from the context, use the exact wording given — do not substitute, generalize, or reword them (e.g. if the context says "Support Developer Intern," say exactly that, not "full-stack intern" or any other paraphrase).`;

/**
 * Generates an AI answer using Groq's streaming API.
 *
 * The response is returned chunk-by-chunk using an AsyncGenerator,
 * allowing the frontend to display the answer as it is generated.
 */
export async function* generateAnswerStream(
  question: string,
  contextChunks: string[],
  recentHistory: chatMessage[] = []
): AsyncGenerator<string> {
  const context = contextChunks.join("\n\n");

  console.log("========== GROQ START ==========");
  console.log("Model: openai/gpt-oss-20b");
  console.log("Question:", question);
  console.log("Context chunks:", contextChunks.length);
  console.log("History messages:", recentHistory.length);
  console.log("Context length:", context.length);

  try {
    console.log("BEFORE GROQ REQUEST");

    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",

      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nContext:\n${context}`,
        },

        ...recentHistory,

        {
          role: "user",
          content: question,
        },
      ],

      temperature: 0.3,

      stream: true,
    });

    console.log("AFTER GROQ REQUEST");

    for await (const chunk of stream) {
      const text =
        chunk.choices[0]?.delta?.content ?? "";

      if (text) {
        console.log("GROQ CHUNK:", text);

        yield text;
      }
    }

    console.log("========== GROQ STREAM COMPLETE ==========");
  } catch (error) {
    console.error("========== GROQ ERROR ==========");

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error(error);
    }

    throw error;
  }
}