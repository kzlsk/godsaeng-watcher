"use client";

import { useQuery } from "@tanstack/react-query";
import type { DailyStats } from "@/entities/checkin/model/types";

export const dailyStatsQueryKey = ["checkins", "today"] as const;

async function fetchDailyStats(): Promise<DailyStats> {
  const response = await fetch("/api/checkins");
  if (!response.ok) throw new Error("오늘의 체크인 데이터를 불러오지 못했습니다.");
  return response.json();
}

export function useDailyStats() {
  return useQuery({
    queryKey: dailyStatsQueryKey,
    queryFn: fetchDailyStats,
  });
}
