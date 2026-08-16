import { supabaseClient } from "./supabase-client";

// Sign up with email + password.
export async function signUpWithEmail(email:string, password: string) {
    const {data, error} = await supabaseClient.auth.signUp({
        email,
        password
    });
    return {data, error};
}

// Sign in with email + password.
export async function signInWithEmail(email:string, password: string) {
    const {data, error} = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    return {data, error};
}

// Sign in with Google (redirects to Google's OAuth flow, then back to your app).
export async function signInWithGoogle(email:string, password: string) {
    const {data, error} = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });
    return {data, error};
}

// Sign out the current user.
export async function signOut(){
    const {error} = await supabaseClient.auth.signOut();
    return {error};
}

// Request a password reset email.
export async function requestPassword(email:string) {
    const {data, error} = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
    })
    return {data, error};
}

// Update password (called from the reset-password page, after clicking the email link).
export async function updatePassword(newPassword:string) {
    const {data, error} = await supabaseClient.auth.updateUser({
        password: newPassword,
    });
    return {data, error};
}

// Get the currently logged-in user, if any.
export async function getCurrentUser() {
    const {data, error} = await supabaseClient.auth.getUser();
    return {user: data.user ?? null, error};
}