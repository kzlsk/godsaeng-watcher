"use client";

import { useQuery } from "@tanstack/react-query";
import type { FocusSession } from "@/entities/focus-session/model/types";

export const focusSessionQueryKey = ["focus-sessions", "active"] as const;

// 다른 기기에서 집중을 시작/중지한 사실을 20초 안에 반영한다.
// 주의: 타이머 화면 안의 1초 카운트는 FocusTimerPanel의 로컬 상태(018 영역)이고,
// 이 폴링은 그 값을 "서버 기준으로 되맞추는" 역할만 한다. 응답이 이전과 완전히
// 같으면 TanStack의 structural sharing이 같은 객체 참조를 유지해서
// FocusTimerPanel의 재동기화 조건(session !== syncedSession)이 아예 성립하지 않고,
// 로컬 일시정지 중에는 패널이 isPendingLocalPause로 재동기화를 건너뛴다.
const FOCUS_SESSION_REFETCH_INTERVAL_MS = 20_000;

async function fetchFocusSession(): Promise<FocusSession> {
  const response = await fetch("/api/focus-sessions");
  if (!response.ok) throw new Error("집중 타이머 정보를 불러오지 못했습니다.");
  return response.json();
}

export function useFocusSession() {
  return useQuery({
    queryKey: focusSessionQueryKey,
    queryFn: fetchFocusSession,
    refetchInterval: FOCUS_SESSION_REFETCH_INTERVAL_MS,
  });
}
