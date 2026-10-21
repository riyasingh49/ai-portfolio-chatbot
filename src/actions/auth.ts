'use server'
import { linkSessionToUser } from "@/db/conversations";
import { getUserIdFromAccessToken } from '@/lib/server-auth';

export async function linkGuestSessionAction(sessionId: string, accessToken: string) {
    const userId = await getUserIdFromAccessToken(accessToken);

    if (!userId) {
        throw new Error('UNAUTHORIZED');
    }

    await linkSessionToUser(sessionId, userId);
    return {success: true};
}
