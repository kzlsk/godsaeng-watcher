// 쓴소리 문구가 매번 비슷한 틀("완료율 → 집중시간 → 서운함 → 요청")로 굳는 문제를 막기 위해,
// 요청마다 서버에서 "이번에 중심으로 짚을 요소", "문장 구조 힌트", "종결 표현", "데이터 나열 순서"를
// 무작위로 정해 프롬프트에 섞는다. 같은 입력이라도 모델이 받는 프롬프트 자체가 달라진다.
// 힌트·종결 표현 문구는 prompts/*.md에서 파싱해 넘겨받는다 (structureHints.ts).
import type { StructureHint } from "./structureHints";

export type RandomFn = () => number;

export type NagFocusKey = "completion" | "focusTime" | "streak" | "deadline";

export interface NagFocusInput {
  mode: "fail" | "success";
  deadlineOverCount?: number;
  focusMinutesToday?: number;
  currentStreak?: number;
}

const FOCUS_DIRECTIVES: Record<"fail" | "success", Record<NagFocusKey, string>> = {
  fail: {
    completion: "오늘 미션 완료율이 낮다는 점",
    focusTime: "집중 시간이 부족하다는 점",
    streak: "스트릭(연속 달성 기록)이 위태롭다는 점",
    deadline: "마감을 넘긴 미션이 쌓여 있다는 점",
  },
  success: {
    completion: "오늘 미션을 전부 끝냈다는 점",
    focusTime: "오늘 쌓은 집중 시간",
    streak: "이어가고 있는 스트릭(연속 달성 기록)",
    deadline: "마감을 지켜냈다는 점",
  },
};

export function pickOne<T>(items: readonly T[], random: RandomFn): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

export function shuffle<T>(items: readonly T[], random: RandomFn): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 데이터가 없거나 모드상 말이 안 되는 요소는 후보에서 뺀다
// (예: 마감 초과 0건인데 "마감 초과를 지적해" 라고 시키면 모델이 숫자를 지어내게 된다).
export function listFocusCandidates(input: NagFocusInput): NagFocusKey[] {
  const candidates: NagFocusKey[] = ["completion"];
  if (input.focusMinutesToday !== undefined) candidates.push("focusTime");
  if (input.currentStreak !== undefined) candidates.push("streak");
  if (input.mode === "fail" && (input.deadlineOverCount ?? 0) > 0) candidates.push("deadline");
  return candidates;
}

/** 후보 중 1~2개를 무작위로 고른다. */
export function pickFocusKeys(input: NagFocusInput, random: RandomFn = Math.random): NagFocusKey[] {
  const candidates = listFocusCandidates(input);
  const count = candidates.length > 1 && random() < 0.5 ? 2 : 1;
  return shuffle(candidates, random).slice(0, count);
}

export function describeFocus(mode: "fail" | "success", keys: NagFocusKey[]): string {
  // 모든 지시 문구가 받침으로 끝나서 조사는 "을"로 고정한다.
  const subjects = keys.map((key) => FOCUS_DIRECTIVES[mode][key]).join(", 그리고 ");
  const verb = mode === "fail" ? "지적해줘" : "칭찬해줘";
  return `이번엔 특히 ${subjects}을 중심으로 ${verb}. 나머지 데이터는 굳이 다 언급하지 않아도 된다.`;
}

// 5회 재생성 안에 "아주 짧은 문장"이 거의 확실히 섞이도록 [short] 힌트는 따로 확률을 준다.
// 균등 추첨(1/9)이면 5회 중 한 번도 안 나올 확률이 약 55%지만, 0.35면 약 12%로 떨어진다.
export const SHORT_HINT_PROBABILITY = 0.35;

export interface VarietyPools {
  hints: StructureHint[];
  endings: string[];
}

/** 직전 요청에서 쓴 힌트·종결 표현 — 연속으로 같은 게 나오지 않게 피한다 */
export interface VarietyAvoid {
  structureHint?: string;
  ending?: string;
}

export interface NagVariety {
  focusKeys: NagFocusKey[];
  structureHint: string;
  short: boolean;
  /** success 모드, [ends] 힌트, 페르소나에 종결 표현 목록이 없는 경우엔 undefined */
  ending?: string;
}

function withoutAvoided<T>(items: T[], isAvoided: (item: T) => boolean): T[] {
  const filtered = items.filter((item) => !isAvoided(item));
  return filtered.length > 0 ? filtered : items;
}

export function pickStructureHint(
  hints: StructureHint[],
  options: { hasPendingMissions: boolean; avoid?: string },
  random: RandomFn = Math.random,
): StructureHint | undefined {
  const eligible = withoutAvoided(
    hints.filter((hint) => options.hasPendingMissions || !hint.mission),
    (hint) => hint.text === options.avoid,
  );
  const shortHints = eligible.filter((hint) => hint.short);
  const otherHints = eligible.filter((hint) => !hint.short);

  if (shortHints.length > 0 && (otherHints.length === 0 || random() < SHORT_HINT_PROBABILITY)) {
    return pickOne(shortHints, random);
  }
  return otherHints.length > 0 ? pickOne(otherHints, random) : undefined;
}

export function pickNagVariety(
  input: NagFocusInput & { hasPendingMissions?: boolean },
  pools: VarietyPools,
  random: RandomFn = Math.random,
  avoid: VarietyAvoid = {},
): NagVariety {
  const focusKeys = pickFocusKeys(input, random);
  const hint = pickStructureHint(
    pools.hints,
    { hasPendingMissions: input.hasPendingMissions ?? false, avoid: avoid.structureHint },
    random,
  );
  const endings = withoutAvoided(pools.endings, (ending) => ending === avoid.ending);
  // 페르소나 md의 종결 표현 목록은 쓴소리(fail)용이라, 칭찬(success)에 붙이면 "대단하네, 흥." 같은 어색한 문장이 된다.
  const ending = input.mode !== "fail" || hint?.ends || endings.length === 0 ? undefined : pickOne(endings, random);

  return {
    focusKeys,
    structureHint: hint?.text ?? "",
    short: hint?.short ?? false,
    ending,
  };
}
