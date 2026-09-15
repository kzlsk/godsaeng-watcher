import type { NagPersonaId } from "@/shared/config/personas";

export const FAIL_FALLBACK_MESSAGES: Record<NagPersonaId, string[]> = {
  realist: [
    "계획을 세운 게 아니라 희망을 적어둔 거였네.",
    "오늘도 내일의 나에게 떠넘겼네.",
  ],
  "furious-boss": [
    "마감을 그렇게 여러 번 옮기면 그게 마감이야?",
    "이 정도면 일정이 아니라 소망이잖아.",
  ],
  "clingy-friend": [
    "오늘도 안 했어? 나 진짜 서운해...",
    "어제도 그러더니 오늘도 미뤘네.",
  ],
};

export const SUCCESS_FALLBACK_MESSAGES: Record<NagPersonaId, string[]> = {
  realist: [
    "오늘처럼만 하면 실력이 되는 거야.",
    "마감 안 넘기고 끝낸 하루, 나쁘지 않네.",
  ],
  "furious-boss": [
    "오늘은 인정. 내일도 이렇게 와.",
    "이 정도면 보고할 만하네.",
  ],
  "clingy-friend": [
    "오늘 다 했다고? 나 완전 감동!",
    "역시 내 친구, 오늘 최고였어!",
  ],
};

export function pickFallbackMessage(mode: "fail" | "success", personaId: NagPersonaId) {
  const pool = mode === "fail" ? FAIL_FALLBACK_MESSAGES[personaId] : SUCCESS_FALLBACK_MESSAGES[personaId];
  return pool[Math.floor(Math.random() * pool.length)];
}
