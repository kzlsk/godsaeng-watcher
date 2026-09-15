"use client";

import { useQuery } from "@tanstack/react-query";
import type { NagMessage } from "@/entities/nag/model/types";

export const nagQueryKey = ["nag", "today"] as const;

async function fetchNag(): Promise<NagMessage> {
  const response = await fetch("/api/nag");
  if (!response.ok) throw new Error("AI 코멘트를 불러오지 못했습니다.");
  return response.json();
}

export function useNag() {
  return useQuery({
    queryKey: nagQueryKey,
    queryFn: fetchNag,
  });
}
