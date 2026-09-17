"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { missionsQueryKey } from "@/entities/mission/model/useMissions";
import { dailyStatsQueryKey } from "@/entities/checkin/model/useDailyStats";
import { streakQueryKey } from "@/entities/streak/model/useStreak";

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
    },
  });
}
