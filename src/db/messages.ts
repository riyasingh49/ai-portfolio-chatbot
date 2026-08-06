import { supabaseAdmin } from "../lib/supabase-admin";
import { chatMessage } from "../types/chat";

// Fetches the last `limit` messages for a conversation, ordered oldest to newest,
// and formats them as ChatMessage[] ready to send to Groq.
export async function getRecentMessage(
    conversationId: string,
    limit = 5,
): Promise<chatMessage[]> {
    const { data, error } = await supabaseAdmin
        .from('messages')
        .select('question,answer,created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(`Failed to fetch message ${error.message}`)
    }
    // Reverse so oldest comes first (we fetched newest-first to apply the limit correctly).
    const ordered = (data ?? []).reverse();

    // Each stored row has both a question and an answer — expand each row
    // into two ChatMessage entries (one user turn, one assistant turn).
    const history: chatMessage[] = ordered.flatMap((order) => [
        { role: 'user' as const, content: order.question },
        { role: 'assistant' as const, content: order.answer },
    ]);
    return history;
}

export async function saveMessage(
    conversationId: string,
    question: string,
    answer: string
) {
    const { error } = await supabaseAdmin
        .from('messages')
        .insert({
            conversation_id: conversationId,
            question,
            answer
        });

    if (error) {
        throw new Error(`Failed to save message ${error.message}`)
    }

}

// Fetches the FULL message history for a conversation, for display in the UI.
// Unlike getRecentMessage(), this has no limit — used for showing the
// complete chat, not for feeding context to Groq.
export async function getFullConversationHistory(
    conversationId: string
): Promise<chatMessage[]> {
    const { data, error } = await supabaseAdmin
        .from('messages')
        .select('question, answer , created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch conversation history ${error.message}`);

    }

    const history: chatMessage[] = (data ?? []).flatMap((row) => [
        { role: 'user' as const, content: row.question },
        { role: 'assistant' as const, content: row.answer },
    ])

    return history;

}