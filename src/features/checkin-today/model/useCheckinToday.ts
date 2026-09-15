"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyStatsQueryKey } from "@/entities/checkin/model/useDailyStats";
import { streakQueryKey } from "@/entities/streak/model/useStreak";

async function recordCheckin(input: { missionId: string; isCompleted: boolean }) {
  const response = await fetch("/api/checkins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("체크인 기록에 실패했습니다.");
  return response.json();
}

export function useCheckinToday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordCheckin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: streakQueryKey });
    },
  });
}
