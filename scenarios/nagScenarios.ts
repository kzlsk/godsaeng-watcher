// 쓴소리 프롬프트·페르소나 재검증용 고정 시나리오 (AGENTS.md: 프롬프트/페르소나 변경 시 scenarios/로 재검증).
// 같은 강도에서 상황만 바꿔 톤이 달라지는지, 같은 상황에서 강도만 바꿔 세기가 달라지는지 본다.
import type { NagPromptContext } from "@/shared/lib/ai/buildNagPrompt";

export type NagScenarioInput = Omit<NagPromptContext, "personaId" | "intensity" | "recentQuotes">;

export interface NagScenario {
  id: string;
  /** 사람이 읽는 상황 설명 (결과 표에 그대로 쓴다) */
  label: string;
  input: NagScenarioInput;
}

/** 시나리오 날짜 기준 시각. 마감 지남 여부가 실행 시점에 따라 바뀌지 않게 고정한다. */
export const SCENARIO_NOW = new Date("2026-10-02T21:00:00+09:00");

export const NAG_SCENARIOS: NagScenario[] = [
  {
    id: "progress-75-no-delay",
    label: "진행률 75%, 지연 없음",
    input: {
      mode: "fail",
      completedCount: 3,
      totalCount: 4,
      delayMinutesToday: 0,
      deadlineOverCount: 0,
      focusMinutesToday: 95,
      currentStreak: 4,
      pendingMissionTitles: [],
      pendingMissions: [{ title: "회고 쓰기", topic: "습관" }],
    },
  },
  {
    id: "progress-50-focus-69",
    label: "진행률 50%, 집중 69분",
    input: {
      mode: "fail",
      completedCount: 2,
      totalCount: 4,
      delayMinutesToday: 20,
      deadlineOverCount: 0,
      focusMinutesToday: 69,
      currentStreak: 2,
      pendingMissionTitles: [],
      pendingMissions: [
        { title: "알고리즘 2문제", topic: "코테" },
        { title: "영어 단어 50개", topic: "어학" },
      ],
    },
  },
  {
    id: "progress-25-low-focus",
    label: "진행률 25%, 집중시간 낮음(12분)",
    input: {
      mode: "fail",
      completedCount: 1,
      totalCount: 4,
      delayMinutesToday: 35,
      deadlineOverCount: 0,
      focusMinutesToday: 12,
      currentStreak: 1,
      pendingMissionTitles: [],
      pendingMissions: [
        { title: "포트폴리오 README 정리", topic: "개발" },
        { title: "CS 면접 질문 10개", topic: "면접" },
        { title: "운동 30분", topic: "습관" },
      ],
    },
  },
  {
    id: "job-application-pending",
    label: "공고 지원 미완료 (마감 지남)",
    input: {
      mode: "fail",
      completedCount: 2,
      totalCount: 3,
      delayMinutesToday: 60,
      deadlineOverCount: 1,
      focusMinutesToday: 50,
      currentStreak: 3,
      pendingMissionTitles: [],
      pendingMissions: [{ title: "백엔드 신입 공고 지원서 제출", topic: "지원", deadline: "2026-10-02T18:00:00+09:00" }],
    },
  },
  {
    id: "delay-accumulated",
    label: "지연 누적, 마감 초과 2건",
    input: {
      mode: "fail",
      completedCount: 1,
      totalCount: 4,
      delayMinutesToday: 180,
      deadlineOverCount: 2,
      focusMinutesToday: 40,
      currentStreak: 0,
      pendingMissionTitles: [],
      pendingMissions: [
        { title: "갓생 트래커 로그인 기능 구현", topic: "개발", deadline: "2026-10-02T12:00:00+09:00" },
        { title: "자소서 2번 문항", topic: "지원", deadline: "2026-10-02T15:00:00+09:00" },
        { title: "SQL 문제 3개", topic: "코테" },
      ],
    },
  },
  {
    id: "progress-0",
    label: "진행률 0%, 거의 아무것도 안 함",
    input: {
      mode: "fail",
      completedCount: 0,
      totalCount: 3,
      delayMinutesToday: 90,
      deadlineOverCount: 0,
      focusMinutesToday: 0,
      currentStreak: 0,
      pendingMissionTitles: [],
      pendingMissions: [
        { title: "알고리즘 1문제", topic: "코테" },
        { title: "회고 쓰기", topic: "습관" },
        { title: "채용 공고 3개 스크랩", topic: "지원" },
      ],
    },
  },
  {
    id: "success-streak-1",
    label: "진행률 100%, 스트릭 1일 (칭찬 모드)",
    input: {
      mode: "success",
      completedCount: 4,
      totalCount: 4,
      delayMinutesToday: 0,
      deadlineOverCount: 0,
      focusMinutesToday: 120,
      currentStreak: 1,
      pendingMissionTitles: [],
    },
  },
];

/** 강도 5구간 대표값. 구간 경계(20/40/60/80)와 최대값을 그대로 쓴다. */
export const INTENSITY_SAMPLES = [20, 40, 60, 80, 100] as const;
