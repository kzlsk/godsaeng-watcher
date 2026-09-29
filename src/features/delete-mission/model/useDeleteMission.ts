"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Mission } from "@/entities/mission/model/types";
import { missionsQueryKey } from "@/entities/mission/model/useMissions";
import { dailyStatsQueryKey } from "@/entities/checkin/model/useDailyStats";
import { streakQueryKey } from "@/entities/streak/model/useStreak";
import { nagQueryKey } from "@/entities/nag/model/useNag";

async function deleteMission(id: string) {
  const response = await fetch(`/api/missions/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("미션 삭제에 실패했습니다.");
}

export function useDeleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMission,
    onSuccess: (_data, id) => {
      // refetch가 끝나기 전에도 목록에서 바로 빠지도록 캐시에서 먼저 제거한다.
      queryClient.setQueryData<Mission[]>(missionsQueryKey, (prev) =>
        prev?.filter((mission) => mission.id !== id),
      );
      queryClient.invalidateQueries({ queryKey: missionsQueryKey });
      queryClient.invalidateQueries({ queryKey: dailyStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: streakQueryKey });
      // 미션 수/완료율이 바뀌면 쓴소리/칭찬 모드도 바뀔 수 있어서 함께 무효화한다.
      queryClient.invalidateQueries({ queryKey: nagQueryKey });
    },
  });
}
