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
- When stating job titles, designations, degrees, or specific factual labels from the context, use the exact wording given — do not substitute, generalize, or reword them (e.g. if the context says "Support Developer Intern," say exactly that, not "full-stack intern" or any other paraphrase).
- Do not use Markdown tables in your responses, since this is a narrow chat interface where tables render poorly. Use short paragraphs or bullet-point lists instead to present multiple items or details.`;
/**
 * Generates an AI answer using Groq's streaming API.
 */
export async function* generateAnswerStream(
  question: string,
  contextChunks: string[],
  recentHistory: chatMessage[] = []
): AsyncGenerator<string> {
  const context = contextChunks.join("\n\n");

  try {
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

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";

      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Groq API error:", error);
    throw error;
  }
}