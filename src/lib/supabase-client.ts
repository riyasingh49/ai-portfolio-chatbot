import { createClient } from "@supabase/supabase-js";

// Browser-safe client using the anon key.
// Used in client components for auth (sign up, sign in, sign out, session checks).
export const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_ANON_KEY!
);