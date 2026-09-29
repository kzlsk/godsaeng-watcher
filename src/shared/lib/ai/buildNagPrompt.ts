import { NAG_PERSONAS, type NagPersonaId } from "@/shared/config/personas";
import { loadIntensityScaleSource, loadPersonaPrompt, loadStructureHintsSource } from "./promptLibrary";
import { parseIntensityScale, pickIntensityDirective } from "./intensityScale";
import {
  describeFocus,
  pickNagVariety,
  shuffle,
  type NagFocusKey,
  type NagVariety,
  type RandomFn,
  type VarietyAvoid,
} from "./nagVariety";
import { parseEndingExpressions, parseStructureHints, resolveHintPool } from "./structureHints";
import { formatMissionLabel, selectMissionsForPrompt, type NagPendingMission } from "./pendingMissions";

export interface NagPromptContext {
  mode: "fail" | "success";
  personaId: NagPersonaId;
  completedCount: number;
  totalCount: number;
  delayMinutesToday: number;
  pendingMissionTitles: string[];
  /**
   * 미완료 미션 상세(제목·카테고리·마감). 있으면 pendingMissionTitles 대신 이걸로 구체적 지적 목록을 만든다.
   * 완료된 미션은 넣지 않는다.
   */
  pendingMissions?: NagPendingMission[];
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
  /** 초점 요소·문장 구조·종결 표현·데이터 순서를 고를 때 쓰는 난수 함수 (테스트에서 고정용). 기본 Math.random */
  random?: RandomFn;
  /** 직전 요청에서 쓴 구조 힌트·종결 표현. 이번엔 피한다 */
  avoid?: VarietyAvoid;
  /** "마감 지남" 판단 기준 시각 (테스트용). 기본 현재 시각 */
  now?: Date;
}

function resolveIntensityDirective(intensity: number | undefined) {
  const scale = parseIntensityScale(loadIntensityScaleSource());
  return pickIntensityDirective(scale, intensity ?? 50);
}

// 성공 모드(전부 완료)에는 지적할 미완료 미션이 없다.
function resolvePendingMissions(context: NagPromptContext): {
  selected: NagPendingMission[];
  total: number;
} {
  if (context.mode !== "fail") return { selected: [], total: 0 };
  const all = context.pendingMissions ?? context.pendingMissionTitles.map((title) => ({ title }));
  const valid = all.filter((mission) => mission.title.trim().length > 0);
  return { selected: selectMissionsForPrompt(valid), total: valid.length };
}

interface DataLine {
  key: NagFocusKey | "delay" | "focusWeek" | "pending";
  text: string;
}

function collectDataLines(
  context: NagPromptContext,
  missions: { selected: NagPendingMission[]; total: number },
  now: Date,
): DataLine[] {
  const completionRate =
    context.totalCount > 0 ? Math.round((context.completedCount / context.totalCount) * 100) : 0;

  const lines: DataLine[] = [
    { key: "completion", text: `오늘 미션 완료율: ${context.completedCount}/${context.totalCount} (${completionRate}%)` },
    { key: "deadline", text: `마감 초과 건수: ${context.deadlineOverCount ?? 0}건` },
    { key: "delay", text: `누적 지연 시간(오늘): ${context.delayMinutesToday}분` },
  ];

  if (context.focusMinutesToday !== undefined) {
    lines.push({ key: "focusTime", text: `오늘 집중 시간: ${context.focusMinutesToday}분` });
  }
  if (context.focusMinutesWeek !== undefined) {
    lines.push({ key: "focusWeek", text: `이번 주 누적 집중 시간: ${context.focusMinutesWeek}분` });
  }
  if (context.currentStreak !== undefined) {
    lines.push({ key: "streak", text: `현재 스트릭: ${context.currentStreak}일` });
  }
  if (missions.selected.length > 0) {
    const labels = missions.selected.map((mission) => formatMissionLabel(mission, now)).join(", ");
    const trimmedNote =
      missions.selected.length < missions.total ? ` (총 ${missions.total}개 중 마감 임박 ${missions.selected.length}개)` : "";
    lines.push({ key: "pending", text: `미완료 미션${trimmedNote}: ${labels}` });
  }

  return lines;
}

// 데이터를 매번 같은 순서로 나열하면 모델이 그 순서를 그대로 문장 틀로 삼는다.
// 이번 초점 요소를 맨 앞에 두고, 나머지는 요청마다 섞는다.
function buildUserPrompt(context: NagPromptContext, lines: DataLine[], variety: NagVariety, random: RandomFn): string {
  const focused = variety.focusKeys
    .map((key) => lines.find((line) => line.key === key))
    .filter((line): line is DataLine => line !== undefined);
  const rest = shuffle(
    lines.filter((line) => !focused.includes(line)),
    random,
  );

  const closing =
    context.mode === "success"
      ? "위 데이터를 근거로 칭찬 코멘트를 한 문장으로 던져줘."
      : "위 데이터를 근거로 쓴소리를 한 문장으로 던져줘.";

  return [...focused, ...rest].map((line) => line.text).concat(closing).join("\n");
}

function buildDirectionSection(context: NagPromptContext, variety: NagVariety): string {
  const lines = ["## 이번 요청의 방향 (매번 달라짐)", `- 초점: ${describeFocus(context.mode, variety.focusKeys)}`];

  if (variety.structureHint) lines.push(`- 문장 구조: ${variety.structureHint}`);
  if (variety.short) {
    lines.push(
      "- 길이 규칙(다른 지시보다 우선): 15자 내외의 한 문장으로 끝내. 숫자는 딱 하나만 쓰고 두 번째 숫자는 절대 넣지 마. 미션 이름은 한두 단어로 줄여서만 써.",
    );
  }
  if (variety.ending) {
    lines.push(
      `- 종결 표현: 이번엔 ${variety.ending} 계열의 어미로 문장을 끝내. 예시 문장을 그대로 베끼지는 말고, 어미가 문법적으로 어색하게 붙으면 같은 느낌의 자연스러운 어미로 바꿔.`,
    );
  }
  lines.push(
    "- 데이터를 나열된 순서대로 하나씩 훑지 마. 위 문장 구조 힌트가 페르소나 말투 규칙과 충돌하면 말투 규칙을 우선해.",
  );

  return lines.join("\n");
}

const MISSION_CALLOUT_SECTION = [
  "## 구체적 지적",
  '- 데이터의 "미완료 미션" 중 하나를 골라, 그 이름을 문장에 자연스럽게 넣어 콕 집어 지적해. (예: "코딩테스트 아직 안 했네")',
  "- 미션 이름으로 문장을 시작하지 마. 문장의 시작은 위 문장 구조 힌트를 따르고, 미션 이름은 문장 중간이나 뒤에 녹여 넣어. (구조 힌트가 미션 이름으로 시작하라고 한 경우만 예외)",
  "- 이름이 길면 핵심 단어로 줄여 불러도 된다. 목록에 없는 미션이나 이미 끝낸 미션은 절대 언급하지 마.",
].join("\n");

export function buildNagPrompt(context: NagPromptContext, options: BuildNagPromptOptions = {}) {
  const persona = NAG_PERSONAS.find((item) => item.id === context.personaId);
  const personaSource = loadPersonaPrompt(context.personaId);
  const personaPrompt = personaSource || `페르소나: ${persona?.name ?? context.personaId}`;
  const { directive, hardRules } = resolveIntensityDirective(context.intensity);
  const random = options.random ?? Math.random;
  const now = options.now ?? new Date();

  const missions = resolvePendingMissions(context);
  const variety = pickNagVariety(
    { ...context, hasPendingMissions: missions.selected.length > 0 },
    {
      hints: resolveHintPool(parseStructureHints(loadStructureHintsSource()), context.personaId),
      endings: parseEndingExpressions(personaSource),
    },
    random,
    options.avoid,
  );

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
    "마침표·물음표·느낌표로 끊어서 두 문장 이상 만들지 마. 문장 부호는 맨 끝에 한 번만 쓴다 (말줄임표 ...는 괜찮다).",
    "실제 숫자를 근거로 삼되 과장하지 말고, 페르소나의 말투를 분명히 드러내.",
    buildDirectionSection(context, variety),
    missions.selected.length > 0 ? MISSION_CALLOUT_SECTION : "",
    recentQuotes.length > 0
      ? [
          "## 반복 금지",
          "아래는 이전에 이미 사용한 문구야. 표현과 문장 구조가 겹치지 않게 새로운 문장으로 써. 특히 같은 첫 단어로 시작하거나 같은 어미로 끝내지 마.",
          ...recentQuotes.map((quote) => `- ${quote}`),
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const user = buildUserPrompt(context, collectDataLines(context, missions, now), variety, random);

  return { system, user, variety, missions: missions.selected };
}
