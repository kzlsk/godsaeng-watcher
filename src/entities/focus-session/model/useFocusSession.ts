"use client";

import { useQuery } from "@tanstack/react-query";
import type { FocusSession } from "@/entities/focus-session/model/types";

export const focusSessionQueryKey = ["focus-sessions", "active"] as const;

async function fetchFocusSession(): Promise<FocusSession> {
  const response = await fetch("/api/focus-sessions");
  if (!response.ok) throw new Error("집중 타이머 정보를 불러오지 못했습니다.");
  return response.json();
}

export function useFocusSession() {
  return useQuery({
    queryKey: focusSessionQueryKey,
    queryFn: fetchFocusSession,
  });
}
