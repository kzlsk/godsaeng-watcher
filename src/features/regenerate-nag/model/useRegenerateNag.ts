"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nagQueryKey } from "@/entities/nag/model/useNag";
import type { NagPersonaId } from "@/shared/config/personas";
import type { NagMessage } from "@/entities/nag/model/types";

async function regenerateNag(personaId?: NagPersonaId): Promise<NagMessage> {
  const response = await fetch("/api/nag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personaId }),
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
