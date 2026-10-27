import { isIP } from 'node:net';
import { supabaseAdmin } from '@/lib/supabase-admin';

type RateLimitOptions = {
    request: Request;
    sessionId: string;
    userId: string | null;
};

type AllowedDecision = {
    allowed: true;
    sessionMessagesRemaining: number | null;
    ipMessagesRemaining: number | null;
};

type RejectedDecision = {
    allowed: false;
    status: 400 | 403 | 429 | 503;
    error: string;
    reason?: string;
    retryAfterSeconds?: number;
};

export type ChatRateLimitDecision =
    | AllowedDecision
    | RejectedDecision;

type ReservationResult = {
    allowed: boolean;
    reason: string;
    retry_after_seconds: number;
    session_messages_remaining: number | null;
    ip_messages_remaining: number | null;
};

/**
 * Reads and validates the IP supplied by the deployment proxy.
 *
 * Only trust this header when the production deployment ensures
 * that clients cannot directly control it.
 */

function getClientIp(request: Request): string | null {
    const headersToCheck = process.env.NODE_ENV === 'development'
      ? ['x-real-ip', 'x-forwarded-for']
      : ['x-real-ip'];
  
    for (const header of headersToCheck) {
      const value = request.headers.get(header)?.trim();
      if (!value) continue;
  
      // x-forwarded-for can contain a comma-separated list.
      const candidates = header === 'x-forwarded-for'
        ? value.split(',').map((ip) => ip.trim())
        : [value];
  
      for (const ip of candidates) {
        if (isIP(ip) !== 0) {
          return ip;
        }
      }
    }
  
    return null;
  }
  

/**
 * Reserves a chat request through Supabase's atomic enforcement
 * function before any knowledge retrieval or LLM generation.
 */
export async function checkChatRateLimit({
    request,
    sessionId,
    userId,
}: RateLimitOptions): Promise<ChatRateLimitDecision> {
    const clientIp = getClientIp(request);

    if (!userId && !clientIp) {
        console.error('Rate limit rejected: client IP unavailable');
        return {
            allowed: false,
            status: 503,
            error: 'CLIENT_IP_UNAVAILABLE',
        };
    }

    const { data, error } = await supabaseAdmin.rpc(
        'reserve_chat_request',
        {
            p_session_id: sessionId,
            p_ip_address: clientIp,
            p_user_id: userId,
        }
    );

    if (error) {
        console.error('Chat rate-limit check failed:', error);

        return {
            allowed: false,
            status: 503,
            error: 'RATE_LIMIT_CHECK_FAILED',
        };
    }

    const reservation = (
        data as ReservationResult[] | null
    )?.[0];

    if (!reservation) {
        return {
            allowed: false,
            status: 503,
            error: 'RATE_LIMIT_CHECK_FAILED',
        };
    }

    if (reservation.allowed) {
        return {
            allowed: true,
            sessionMessagesRemaining:
                reservation.session_messages_remaining,
            ipMessagesRemaining:
                reservation.ip_messages_remaining,
        };
    }

    const { reason } = reservation;

    if (
        reason === 'GUEST_SESSION_LIMIT' ||
        reason === 'GUEST_IP_LIMIT'
    ) {
        return {
            allowed: false,
            status: 403,
            error: 'GUEST_LIMIT_REACHED',
            reason,
        };
    }

    if (
        reason === 'SESSION_RATE_LIMIT' ||
        reason === 'IP_RATE_LIMIT' ||
        reason === 'USER_RATE_LIMIT'
    ) {
        return {
            allowed: false,
            status: 429,
            error: 'RATE_LIMITED',
            reason,
            retryAfterSeconds: Math.max(
                1,
                reservation.retry_after_seconds || 60
            ),
        };
    }

    return {
        allowed: false,
        status: 400,
        error: 'REQUEST_REJECTED',
        reason,
    };
}