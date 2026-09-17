"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { missionsQueryKey } from "@/entities/mission/model/useMissions";
import type { CreateMissionInput } from "@/entities/mission/model/types";
import { buildAddMissionPayload } from "@/features/add-mission/model/buildAddMissionPayload";

async function addMission(input: CreateMissionInput) {
  const payload = buildAddMissionPayload(input);

  const response = await fetch("/api/missions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("미션 추가에 실패했습니다.");
  return response.json();
}

export function useAddMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionsQueryKey });
    },
  });
}
