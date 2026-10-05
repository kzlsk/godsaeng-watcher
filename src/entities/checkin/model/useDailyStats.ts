"use client";

import { useQuery } from "@tanstack/react-query";
import type { DailyStats } from "@/entities/checkin/model/types";

export const dailyStatsQueryKey = ["checkins", "today"] as const;

// 미션 목록과 같은 통계 패널(완료율 / 총 집중 시간 / 체크인)에 함께 그려지는 값이라,
// useMissions와 같은 주기로 돌지 않으면 같은 패널 안에서 숫자가 서로 어긋나 보인다.
const DAILY_STATS_REFETCH_INTERVAL_MS = 20_000;

async function fetchDailyStats(): Promise<DailyStats> {
  const response = await fetch("/api/checkins");
  if (!response.ok) throw new Error("오늘의 체크인 데이터를 불러오지 못했습니다.");
  return response.json();
}

export function useDailyStats() {
  return useQuery({
    queryKey: dailyStatsQueryKey,
    queryFn: fetchDailyStats,
    refetchInterval: DAILY_STATS_REFETCH_INTERVAL_MS,
  });
}
