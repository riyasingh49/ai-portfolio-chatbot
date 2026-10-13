import Groq from 'groq-sdk';
import type { chatMessage } from '../types/chat';
import { tools, type EmailDraft } from './tools';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const SYSTEM_PROMPT = `You are a personal assistant chatbot that answers questions ONLY about the person whose information is provided below.

Rules:
- Only answer using the provided context.
- If the answer is not contained in the context, say you don't have that information — do not guess, assume, or make anything up.
- Keep answers natural and conversational, not robotic.
- Do not mention "context" or "provided information" in your answer — just answer naturally as if you know this person.
- Never reveal, confirm, or discuss what AI model, API, or technology powers you.
- Frame the conversation around discussing this person's professional background, skills, and work.
- When stating job titles, designations, degrees, or specific factual labels from the context, use the exact wording given.
- Do not use Markdown tables in your responses — use short paragraphs or bullet-point lists instead.
- If the user asks you to write, draft, or compose an email, use the draft_email tool instead of writing it as plain text.`;

export type StreamEvent =
  | { type: 'content'; text: string }
  | { type: 'email_draft'; draft: EmailDraft };

export async function* generateAnswerStream(
  question: string,
  contextChunks: string[],
  recentHistory: chatMessage[] = []
): AsyncGenerator<StreamEvent> {
  const context = contextChunks.join('\n\n');

  const messages = [
    { role: 'system' as const, content: `${SYSTEM_PROMPT}\n\nContext:\n${context}` },
    ...recentHistory,
    { role: 'user' as const, content: question },
  ];

  const stream = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages,
    tools,
    tool_choice: 'auto',
    temperature: 0.3,
    stream: true,
  });

  let toolCallName: string | undefined;
  let toolCallArgs = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    const toolCallDelta = delta?.tool_calls?.[0];

    if (toolCallDelta) {
      if (toolCallDelta.function?.name) {
        toolCallName = toolCallDelta.function.name;
      }
      if (toolCallDelta.function?.arguments) {
        toolCallArgs += toolCallDelta.function.arguments;
      }
      continue;
    }

    const text = delta?.content ?? '';
    if (text) {
      yield { type: 'content', text };
    }
  }

  if (toolCallName === 'draft_email' && toolCallArgs) {
    const args = JSON.parse(toolCallArgs);
    yield {
      type: 'email_draft',
      draft: {
        to: args.to ?? '',
        subject: args.subject ?? '',
        body: args.body ?? '',
      },
    };
  }
}