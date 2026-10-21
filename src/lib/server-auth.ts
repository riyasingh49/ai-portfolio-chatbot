import { supabaseAdmin } from '@/lib/supabase-admin';

// Access tokens are untrusted input until Supabase has validated them.
export async function getUserIdFromAccessToken(accessToken: string) {
  if (typeof accessToken !== 'string' || !accessToken) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}
