import type { CreateMissionInput } from "@/entities/mission/model/types";
import { toDeadlineIso } from "@/features/add-mission/model/toDeadlineIso";

/**
 * POST /api/missions에 보낼 요청 바디를 만든다.
 * deadline이 비어 있으면 변환을 생략하고 필드 자체를 아예 넣지 않는다.
 */
export function buildAddMissionPayload(input: CreateMissionInput, now?: Date) {
  const { deadline, ...rest } = input;
  return deadline ? { ...rest, deadline: toDeadlineIso(deadline, now) } : rest;
}
