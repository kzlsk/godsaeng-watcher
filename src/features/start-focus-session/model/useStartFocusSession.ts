"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { focusSessionQueryKey } from "@/entities/focus-session/model/useFocusSession";
import type { FocusSession } from "@/entities/focus-session/model/types";

type FocusAction = "start" | "pause" | "resume" | "stop";

interface UpdateFocusSessionInput {
  missionId?: string;
  action: FocusAction;
}

async function updateFocusSession(input: UpdateFocusSessionInput): Promise<FocusSession> {
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
    mutationFn: updateFocusSession,
    onSuccess: (data, variables) => {
      // 서버는 "정지"를 "일시정지"와 동일한 paused로 돌려준다 — 재개 의도가
      // 없다는 건 클라이언트만 아는 사실이라 여기서 status를 덮어쓴다.
      const status = variables.action === "stop" ? "stopped" : data.status;
      queryClient.setQueryData(focusSessionQueryKey, { ...data, status });
    },
  });
}
