"use client";

import { createClient } from "@/shared/lib/supabase/client";

type OAuthProvider = "kakao" | "google";

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
