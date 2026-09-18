"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export const pausedMarkerQueryKey = ["focus-sessions", "paused-marker"] as const;

export interface PausedMarker {
  missionId: string | null;
  // 일시정지를 누른 시점(ISO) — 재개/중지 시 DB 세그먼트를 이 시점으로 닫는다.
  pausedAt: string;
}

// "일시정지"는 DB에 반영되지 않는 순수 프론트 상태다. FocusTimerPanel뿐 아니라
// 미션 목록의 "집중 시작" 버튼(다른 미션을 새로 시작하는 경우)도 "지금 일시정지
// 중인 세그먼트가 있는가"를 알아야 그 세그먼트를 올바른 시점에 닫을 수 있어서,
// 컴포넌트 로컬 상태가 아니라 React Query 캐시에 전역 상태처럼 공유해둔다.
export function usePausedMarker() {
  return useQuery<PausedMarker | null>({
    queryKey: pausedMarkerQueryKey,
    queryFn: () => null,
    initialData: null,
    staleTime: Infinity,
  });
}

export function useSetPausedMarker() {
  const queryClient = useQueryClient();
  return (marker: PausedMarker | null) => {
    queryClient.setQueryData(pausedMarkerQueryKey, marker);
  };
}
