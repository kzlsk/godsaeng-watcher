"use client";

import { useQuery } from "@tanstack/react-query";
import type { NagMessage } from "@/entities/nag/model/types";

export const nagQueryKey = ["nag", "today"] as const;

// 폴링 대상 중 가장 비싼 엔드포인트라 허용 범위(15~30초)의 가장 느린 쪽을 쓴다.
// GET /api/nag은 매번 missions/focus_sessions(오늘·주간)/checkins를 집계하고,
// mode가 바뀐 순간에만 OpenAI를 호출한다(그 외에는 nag_logs 캐시 재사용).
// 즉 폴링을 걸어도 AI 호출이 주기마다 늘지는 않지만, DB 집계 비용은 주기만큼 늘어난다.
const NAG_REFETCH_INTERVAL_MS = 30_000;

async function fetchNag(): Promise<NagMessage> {
  const response = await fetch("/api/nag");
  if (!response.ok) throw new Error("AI 코멘트를 불러오지 못했습니다.");
  return response.json();
}

export function useNag() {
  return useQuery({
    queryKey: nagQueryKey,
    queryFn: fetchNag,
    refetchInterval: NAG_REFETCH_INTERVAL_MS,
  });
}
