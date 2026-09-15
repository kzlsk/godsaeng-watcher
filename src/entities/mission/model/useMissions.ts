"use client";

import { useQuery } from "@tanstack/react-query";
import type { Mission } from "@/entities/mission/model/types";

export const missionsQueryKey = ["missions", "today"] as const;

async function fetchMissions(): Promise<Mission[]> {
  const response = await fetch("/api/missions");
  if (!response.ok) throw new Error("미션을 불러오지 못했습니다.");
  const data = await response.json();
  return data.missions as Mission[];
}

export function useMissions() {
  return useQuery({
    queryKey: missionsQueryKey,
    queryFn: fetchMissions,
  });
}
