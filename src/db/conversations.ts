import { supabaseAdmin } from "@/lib/supabase-admin";

// Finds an existing conversation for a guest session, or creates a new one.
export async function getOrCreateSession(sessionId: string) {
    const { data: existing, error: findError } = await supabaseAdmin
        .from('conversation')
        .select('id')
        .eq('session_id', sessionId)
        .is('user_id', null)
        .maybeSingle();

    if (findError) {
        throw new Error(`Failed to lookup message ${findError.message}`);
    }

    if (existing) {
        return existing.id as string;
    }

    const { data: created, error: createError } = await supabaseAdmin
        .from('conversation')
        .insert({ session_id: sessionId })
        .select('id')
        .single();

    if (createError) {
        throw new Error('Failed to create converation ${createError.message');
    }

    return created.id as string;

}

// Links a guest session's conversation(s) to a newly authenticated user.
export async function linkSessionToUser(sessionId: string, userId: string) {
    const { error } = await supabaseAdmin
        .from('conversation')
        .update({ user_id: userId })
        .eq('session_id', sessionId)
        .is('user_id', null);

    if (error) {
        throw new Error(`Failed to link session to user ${error.message}`);
    }
}

// Finds an existing conversation for a logged-in user, or creates a new one.
export async function getOrCreateConversationForUser(userId: string) {
    const { data: existing, error: findError } = await supabaseAdmin
        .from('conversation')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (findError) {
        throw new Error(`Failed to lookup conversation ${findError.message}`);
    }

    if (existing) {
        return existing.id as string;
    }

    const { data: created, error: createError } = await supabaseAdmin
        .from('conversation')
        .insert({ user_id: userId })
        .select('id')
        .single();

    if (createError) {
        throw new Error(`Failed to create conversation ${createError.message}`);
    }

    return created.id as string;

}