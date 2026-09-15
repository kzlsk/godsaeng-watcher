import "server-only";
import type { Mission, CreateMissionInput } from "@/entities/mission/model/types";
import type { DailyStats } from "@/entities/checkin/model/types";
import type { FocusSession } from "@/entities/focus-session/model/types";
import type { StreakSummary } from "@/entities/streak/model/types";
import type { NagMessage } from "@/entities/nag/model/types";
import { NAG_PERSONAS, type NagPersonaId } from "@/shared/config/personas";

// In-memory demo store. Swap for real Supabase tables once the schema lands —
// this keeps the UI fully interactive against realistic data in the meantime.
interface DemoState {
  missions: Mission[];
  focusSession: FocusSession;
  streak: StreakSummary;
  nag: NagMessage;
}

declare global {
  var __godsaengDemoState: DemoState | undefined;
}

function createInitialState(): DemoState {
  return {
    missions: [
      {
        id: "1",
        topic: "취업",
        todo: "프론트엔드 포트폴리오 지원서 1개 제출",
        deadline: "10:00",
        isImportant: false,
        isCompleted: true,
        actualFocusMinutes: 38,
      },
      {
        id: "2",
        topic: "코테",
        todo: "코딩 테스트 — 이분 탐색 2문제",
        deadline: "13:00",
        isImportant: true,
        isCompleted: false,
        actualFocusMinutes: null,
      },
      {
        id: "3",
        topic: "프로젝트",
        todo: "사이드 프로젝트 README 정리",
        deadline: "17:30",
        isImportant: false,
        isCompleted: false,
        actualFocusMinutes: null,
      },
      {
        id: "4",
        topic: "습관",
        todo: "오늘 회고 3줄 쓰기",
        deadline: "22:00",
        isImportant: false,
        isCompleted: false,
        actualFocusMinutes: null,
      },
    ],
    focusSession: {
      id: null,
      missionId: "2",
      missionTitle: "코테 2문제",
      targetMinutes: 37,
      elapsedSeconds: 18 * 60 + 42,
      status: "idle",
      deadlineLabel: "2h 18m",
    },
    streak: {
      currentStreak: 12,
      weeklyScore: 84,
      weeklyScoreDelta: 9,
      last7Days: [true, true, true, true, true, true, false],
    },
    nag: {
      mode: "fail",
      quote: "계획을 세운 게 아니라 희망을 적어둔 거였네.",
      activePersonaId: "realist",
      personas: NAG_PERSONAS.map((persona) => ({ ...persona, score: 84 })),
    },
  };
}

function getState(): DemoState {
  if (!globalThis.__godsaengDemoState) {
    globalThis.__godsaengDemoState = createInitialState();
  }
  return globalThis.__godsaengDemoState;
}

export function getMissions(): Mission[] {
  return getState().missions;
}

export function addMission(input: CreateMissionInput): Mission {
  const mission: Mission = {
    id: crypto.randomUUID(),
    topic: input.topic,
    todo: input.todo,
    deadline: input.deadline,
    isImportant: input.isImportant,
    isCompleted: false,
    actualFocusMinutes: null,
  };
  getState().missions.push(mission);
  return mission;
}

export function setMissionCompletion(id: string, isCompleted: boolean): Mission | null {
  const mission = getState().missions.find((item) => item.id === id);
  if (!mission) return null;
  mission.isCompleted = isCompleted;
  return mission;
}

export function getDailyStats(): DailyStats {
  const missions = getState().missions;
  const totalFocusMinutes = missions.reduce((sum, mission) => sum + (mission.actualFocusMinutes ?? 0), 0);

  return {
    totalFocusMinutes,
    focusAheadMinutes: 9,
    delayMinutesToday: 47,
    delayMinutesWeek: 132,
  };
}

export function getFocusSession(): FocusSession {
  return getState().focusSession;
}

export function updateFocusSession(action: "start" | "pause" | "resume", missionId?: string): FocusSession {
  const session = getState().focusSession;
  if (action === "start") {
    const mission = missionId ? getState().missions.find((item) => item.id === missionId) : null;
    session.status = "running";
    if (mission) {
      session.missionId = mission.id;
      session.missionTitle = mission.todo;
    }
  } else if (action === "resume") {
    session.status = "running";
  } else {
    session.status = "paused";
  }
  return session;
}

export function getStreak(): StreakSummary {
  return getState().streak;
}

export function getNag(): NagMessage {
  return getState().nag;
}

export function setNagMessage(quote: string, personaId: NagPersonaId, mode: "fail" | "success"): NagMessage {
  const state = getState();
  state.nag.quote = quote;
  state.nag.activePersonaId = personaId;
  state.nag.mode = mode;
  return state.nag;
}

export function computeNagMode(): "fail" | "success" {
  const missions = getState().missions;
  return missions.every((mission) => mission.isCompleted) ? "success" : "fail";
}
