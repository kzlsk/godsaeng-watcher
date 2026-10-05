"use client";

import { useQuery } from "@tanstack/react-query";
import type { Mission } from "@/entities/mission/model/types";

export const missionsQueryKey = ["missions", "today"] as const;

// 대시보드 핵심 데이터 폴링 주기. 다른 기기에서 미션을 추가/완료/삭제해도
// 수동 새로고침 없이 20초 안에 따라오게 한다.
// refetchInterval은 staleTime을 무시하고 주기마다 실제 요청을 보내지만,
// refetchIntervalInBackground 기본값(false) 때문에 창이 포커스되어 있을 때만
// 발사된다 → 백그라운드 탭을 열어둬도 요청이 쌓이지 않는다.
const MISSIONS_REFETCH_INTERVAL_MS = 20_000;

async function fetchMissions(): Promise<Mission[]> {
  const response = await fetch("/api/missions");
  if (!response.ok) throw new Error("미션을 불러오지 못했습니다.");
  return (await response.json()) as Mission[];
}

export function useMissions() {
  return useQuery({
    queryKey: missionsQueryKey,
    queryFn: fetchMissions,
    refetchInterval: MISSIONS_REFETCH_INTERVAL_MS,
  });
}
