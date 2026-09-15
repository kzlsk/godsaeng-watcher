"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { focusSessionQueryKey } from "@/entities/focus-session/model/useFocusSession";

type FocusAction = "start" | "pause" | "resume";

async function updateFocusSession(input: { missionId?: string; action: FocusAction }) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: focusSessionQueryKey });
    },
  });
}
