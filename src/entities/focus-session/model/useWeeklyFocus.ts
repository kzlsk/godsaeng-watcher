"use client";

import { useQuery } from "@tanstack/react-query";
import type { WeeklyFocusSummary } from "@/entities/focus-session/model/types";

export const weeklyFocusQueryKey = ["focus-sessions", "weekly"] as const;

async function fetchWeeklyFocus(): Promise<WeeklyFocusSummary> {
  const response = await fetch("/api/focus-sessions/weekly");
  if (!response.ok) throw new Error("주간 집중 시간을 불러오지 못했습니다.");
  return response.json();
}

export function useWeeklyFocus() {
  return useQuery({
    queryKey: weeklyFocusQueryKey,
    queryFn: fetchWeeklyFocus,
  });
}
