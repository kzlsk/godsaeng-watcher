"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { focusSessionQueryKey } from "@/entities/focus-session/model/useFocusSession";
import { pausedMarkerQueryKey, type PausedMarker } from "@/entities/focus-session/model/pausedMarker";
import type { FocusSession } from "@/entities/focus-session/model/types";
import { missionsQueryKey } from "@/entities/mission/model/useMissions";

export type FocusSessionAction = "start" | "resume" | "stop";

export interface UpdateFocusSessionInput {
  missionId?: string;
  action: FocusSessionAction;
  // 일시정지 시점. 넘기지 않으면 아래 mutationFn이 공유 일시정지 마커에서 채운다.
  endedAt?: string;
}

async function postFocusSession(input: {
  missionId?: string;
  action: FocusSessionAction;
  endedAt?: string;
}): Promise<FocusSession> {
  const response = await fetch("/api/focus-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("집중 타이머 상태 변경에 실패했습니다.");
  return response.json();
}

export function useStartFocusSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateFocusSessionInput) => {
      // 다른 미션의 "집중 시작" 버튼 등, 일시정지 사실을 모르는 호출부가 endedAt
      // 없이 요청해도 이미 일시정지 중인 세그먼트가 있으면 "지금"이 아니라 그
      // 일시정지 시점으로 먼저 닫히도록 한다 — A를 일시정지한 채 B를 시작해도
      // A의 시간이 부풀려지지 않게 하기 위함.
      const pending = queryClient.getQueryData<PausedMarker | null>(pausedMarkerQueryKey);
      const endedAt = input.endedAt ?? pending?.pausedAt;
      return postFocusSession({ ...input, endedAt });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(focusSessionQueryKey, data);
      queryClient.setQueryData(pausedMarkerQueryKey, null);
      // stop 시 미션의 actualFocusMinutes(focus_sessions.duration_min 합산)가
      // 바뀌므로, 미션 목록의 "· N분" 표시도 새로고침 없이 갱신되도록 무효화한다.
      // start/resume은 실제로는 값이 안 바뀌지만 액션별로 분기할 이유가 없어 동일하게 처리.
      queryClient.invalidateQueries({ queryKey: missionsQueryKey });
    },
  });
}
