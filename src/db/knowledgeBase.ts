import { supabaseAdmin } from "@/lib/supabase-admin";

// Removes all existing rows from knowledge_base.
// Used before re-embedding, so re-running the script doesn't create duplicates.
export async function clearKnowledgeBase(){
    const {error} = await supabaseAdmin
    .from('knowledge_base')
    .delete()
    .neq('id','00000000-0000-0000-0000-000000000000');

    if(error){
        throw new Error(`Failed to clear knowledge base ${error.message}`);
    }
}

// Inserts one content + embedding pair into knowledge_base.
export async function insertKnowledgeEntry(content: string, embedding: number[]){
    const {error} = await supabaseAdmin
    .from('knowledge_base')
    .insert({content, embedding})

    return ({error})
}

// Searches knowledge_base for the chunks most semantically similar
// to a given embedding, using the match_knowledge SQL function (Module 2)
export async function searchKnowledgeBase(
    queryEmbedding: number[],
    matchThreshold = 0.15,
    matchCount = 12
){
    const {data , error} = await supabaseAdmin.rpc('match_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count : matchCount,
    });

    if(error){
        throw new Error(`Failed to search knowledge base ${error.message}`);
    }

    return data as {id: string; content:string; similarity: number}[];
}