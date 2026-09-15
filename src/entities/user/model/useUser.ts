"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import type { AppUser } from "@/entities/user/model/types";

function toAppUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null): AppUser | null {
  if (!user) return null;
  const nickname =
    (user.user_metadata?.nickname as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "게스트";

  return { id: user.id, nickname, email: user.email ?? null };
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(toAppUser(data.user));
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAppUser(session?.user ?? null));
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { user, isLoading };
}
