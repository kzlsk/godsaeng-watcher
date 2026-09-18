"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { missionsQueryKey } from "@/entities/mission/model/useMissions";
import { dailyStatsQueryKey } from "@/entities/checkin/model/useDailyStats";
import { streakQueryKey } from "@/entities/streak/model/useStreak";
import { nagQueryKey } from "@/entities/nag/model/useNag";

async function toggleMission(input: { id: string; isCompleted: boolean }) {
  const { id, isCompleted } = input;
  const response = await fetch(`/api/missions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isCompleted }),
  });
  if (!response.ok) throw new Error("미션 상태 변경에 실패했습니다.");
  return response.json();
}

export function useToggleMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionsQueryKey });
      queryClient.invalidateQueries({ queryKey: dailyStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: streakQueryKey });
      // 완료율이 바뀌면 쓴소리/칭찬 모드도 바뀔 수 있어서, 새로고침 없이 카드가 바로 전환되도록 무효화한다.
      queryClient.invalidateQueries({ queryKey: nagQueryKey });
    },
  });
}
