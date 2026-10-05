"use client";

import { useQuery } from "@tanstack/react-query";
import type { StreakSummary } from "@/entities/streak/model/types";

export const streakQueryKey = ["streak"] as const;

// 스트릭/주간 점수는 하루 단위로 바뀌는 값이라 30초면 충분하다.
const STREAK_REFETCH_INTERVAL_MS = 30_000;

async function fetchStreak(): Promise<StreakSummary> {
  const response = await fetch("/api/streak");
  if (!response.ok) throw new Error("스트릭 정보를 불러오지 못했습니다.");
  return response.json();
}

export function useStreak() {
  return useQuery({
    queryKey: streakQueryKey,
    queryFn: fetchStreak,
    refetchInterval: STREAK_REFETCH_INTERVAL_MS,
  });
}
