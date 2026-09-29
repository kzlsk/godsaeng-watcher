"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nagQueryKey } from "@/entities/nag/model/useNag";
import type { NagPersonaId } from "@/shared/config/personas";
import type { NagMessage } from "@/entities/nag/model/types";

export interface RegenerateNagInput {
  personaId?: NagPersonaId;
  /** 0~100. 이번 생성에만 반영되고 저장되지 않는다. 생략하면 서버 기본값(50). */
  intensity?: number;
}

async function regenerateNag({ personaId, intensity }: RegenerateNagInput = {}): Promise<NagMessage> {
  const response = await fetch("/api/nag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personaId, intensity }),
  });
  if (!response.ok) throw new Error("AI 코멘트를 다시 받아오지 못했습니다.");
  return response.json();
}

export function useRegenerateNag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regenerateNag,
    onSuccess: (data) => {
      queryClient.setQueryData(nagQueryKey, data);
    },
  });
}
