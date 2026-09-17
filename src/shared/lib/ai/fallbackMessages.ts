import type { NagPersonaId } from "@/shared/config/personas";

export const FAIL_FALLBACK_MESSAGES: Record<NagPersonaId, string[]> = {
  realist: [
    "계획을 세운 게 아니라 희망을 적어둔 거였네.",
    "오늘도 내일의 나에게 떠넘겼네.",
    "숫자는 거짓말을 안 하는데, 오늘 숫자가 그 증거야.",
    "미룬 건 오늘도 그대로 남아있어.",
  ],
  "furious-boss": [
    "마감을 그렇게 여러 번 옮기면 그게 마감이야?",
    "이 정도면 일정이 아니라 소망이잖아.",
    "보고할 내용이 없는 게 아니라 안 한 거잖아.",
    "이러면 내가 뭘 믿고 다음 일을 맡기냐.",
  ],
  "clingy-friend": [
    "오늘도 안 했어? 나 진짜 서운해...",
    "어제도 그러더니 오늘도 미뤘네.",
    "나 계속 기다렸는데... 오늘도야?",
    "약속했잖아, 나 진짜 속상해.",
  ],
};

export const SUCCESS_FALLBACK_MESSAGES: Record<NagPersonaId, string[]> = {
  realist: [
    "오늘처럼만 하면 실력이 되는 거야.",
    "마감 안 넘기고 끝낸 하루, 나쁘지 않네.",
    "오늘 데이터는 흠잡을 데가 없네.",
    "이 정도 페이스면 다음 주도 걱정 없겠어.",
  ],
  "furious-boss": [
    "오늘은 인정. 내일도 이렇게 와.",
    "이 정도면 보고할 만하네.",
    "이게 되는 애였네. 내일도 기대한다.",
    "오늘 같은 날만 있으면 내가 걱정할 게 없지.",
  ],
  "clingy-friend": [
    "오늘 다 했다고? 나 완전 감동!",
    "역시 내 친구, 오늘 최고였어!",
    "나 진짜 뿌듯해, 오늘 완전 잘했어!",
    "이러니까 내가 너 좋아하지!",
  ],
};

/**
 * excludeQuotes에 있는 문구는 최대한 피해서 고른다. (재생성 시 반복 방지)
 * 풀이 excludeQuotes로 전부 소진되면 어쩔 수 없이 전체 풀에서 다시 고른다.
 */
export function pickFallbackMessage(
  mode: "fail" | "success",
  personaId: NagPersonaId,
  excludeQuotes: string[] = [],
) {
  const pool = mode === "fail" ? FAIL_FALLBACK_MESSAGES[personaId] : SUCCESS_FALLBACK_MESSAGES[personaId];
  const candidates = pool.filter((quote) => !excludeQuotes.includes(quote));
  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}
