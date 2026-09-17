import { NAG_PERSONAS, type NagPersonaId } from "@/shared/config/personas";
import { loadIntensityScaleSource, loadPersonaPrompt } from "./promptLibrary";
import { parseIntensityScale, pickIntensityDirective } from "./intensityScale";

export interface NagPromptContext {
  mode: "fail" | "success";
  personaId: NagPersonaId;
  completedCount: number;
  totalCount: number;
  delayMinutesToday: number;
  pendingMissionTitles: string[];
  /** nag_settings.intensity — 0~100, 생략 시 50(기본값)으로 취급 */
  intensity?: number;
  /** 마감을 넘긴 미션 건수 */
  deadlineOverCount?: number;
  focusMinutesToday?: number;
  focusMinutesWeek?: number;
  currentStreak?: number;
  /** 재생성 시 반복을 피하기 위해 호출자가 직접 넘기는 최근 문구 (선택) */
  recentQuotes?: string[];
}

export interface BuildNagPromptOptions {
  /** buildNagPrompt 내부 호출 시 병합할 추가 최근 문구 (예: 서버 메모리 히스토리) */
  recentQuotes?: string[];
}

function resolveIntensityDirective(intensity: number | undefined) {
  const scale = parseIntensityScale(loadIntensityScaleSource());
  return pickIntensityDirective(scale, intensity ?? 50);
}

function buildUserPrompt(context: NagPromptContext): string {
  const completionRate =
    context.totalCount > 0 ? Math.round((context.completedCount / context.totalCount) * 100) : 0;

  const lines = [
    `오늘 미션 완료율: ${context.completedCount}/${context.totalCount} (${completionRate}%)`,
    `마감 초과 건수: ${context.deadlineOverCount ?? 0}건`,
    `누적 지연 시간(오늘): ${context.delayMinutesToday}분`,
  ];

  if (context.focusMinutesToday !== undefined) {
    lines.push(`오늘 집중 시간: ${context.focusMinutesToday}분`);
  }
  if (context.focusMinutesWeek !== undefined) {
    lines.push(`이번 주 누적 집중 시간: ${context.focusMinutesWeek}분`);
  }
  if (context.currentStreak !== undefined) {
    lines.push(`현재 스트릭: ${context.currentStreak}일`);
  }

  if (context.mode === "success") {
    lines.push("위 데이터를 근거로 칭찬 코멘트를 한 문장으로 던져줘.");
  } else {
    lines.push(`아직 남은 미션: [${context.pendingMissionTitles.join(", ")}]`);
    lines.push("위 데이터를 근거로 쓴소리를 한 문장으로 던져줘.");
  }

  return lines.join("\n");
}

export function buildNagPrompt(context: NagPromptContext, options: BuildNagPromptOptions = {}) {
  const persona = NAG_PERSONAS.find((item) => item.id === context.personaId);
  const personaPrompt = loadPersonaPrompt(context.personaId) || `페르소나: ${persona?.name ?? context.personaId}`;
  const { directive, hardRules } = resolveIntensityDirective(context.intensity);

  const recentQuotes = Array.from(
    new Set([...(options.recentQuotes ?? []), ...(context.recentQuotes ?? [])]),
  ).filter(Boolean);

  const system = [
    personaPrompt,
    `## 강도 (intensity=${context.intensity ?? 50})`,
    directive,
    hardRules,
    "## 출력 형식",
    "반드시 한국어 한 문장으로만 답해. 따옴표나 설명 없이 코멘트 본문만 출력해.",
    "실제 숫자(완료 개수, 지연 시간 등)를 근거로 삼되 과장하지 말고, 페르소나의 말투를 분명히 드러내.",
    recentQuotes.length > 0
      ? [
          "## 반복 금지",
          "아래는 이전에 이미 사용한 문구야. 표현과 문장 구조가 겹치지 않게 새로운 문장으로 써.",
          ...recentQuotes.map((quote) => `- ${quote}`),
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const user = buildUserPrompt(context);

  return { system, user };
}
