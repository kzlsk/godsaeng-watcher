"use client";

import { useQuery } from "@tanstack/react-query";
import type { StreakSummary } from "@/entities/streak/model/types";

export const streakQueryKey = ["streak"] as const;

async function fetchStreak(): Promise<StreakSummary> {
  const response = await fetch("/api/streak");
  if (!response.ok) throw new Error("스트릭 정보를 불러오지 못했습니다.");
  return response.json();
}

export function useStreak() {
  return useQuery({
    queryKey: streakQueryKey,
    queryFn: fetchStreak,
  });
}
