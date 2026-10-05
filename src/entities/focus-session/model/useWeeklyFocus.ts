"use client";

import { useQuery } from "@tanstack/react-query";
import type { WeeklyFocusSummary } from "@/entities/focus-session/model/types";

export const weeklyFocusQueryKey = ["focus-sessions", "weekly"] as const;

// 주간 누적은 분 단위 집계라 초 단위로 바뀌지 않는다 → 미션/세션보다 느린 30초.
const WEEKLY_FOCUS_REFETCH_INTERVAL_MS = 30_000;

async function fetchWeeklyFocus(): Promise<WeeklyFocusSummary> {
  const response = await fetch("/api/focus-sessions/weekly");
  if (!response.ok) throw new Error("주간 집중 시간을 불러오지 못했습니다.");
  return response.json();
}

export function useWeeklyFocus() {
  return useQuery({
    queryKey: weeklyFocusQueryKey,
    queryFn: fetchWeeklyFocus,
    refetchInterval: WEEKLY_FOCUS_REFETCH_INTERVAL_MS,
  });
}
