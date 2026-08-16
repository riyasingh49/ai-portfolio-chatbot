'use server'
import { linkSessionToUser } from "@/db/conversations";

export async function linkGuestSessionAction(sessionId :string , userId: string) {
    await linkSessionToUser(sessionId, userId);
    return {success: true};
}