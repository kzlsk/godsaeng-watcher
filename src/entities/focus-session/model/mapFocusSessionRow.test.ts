import { describe, expect, it } from "vitest";
import { formatDeadlineLabel, toFocusSession, type FocusSessionRow } from "./mapFocusSessionRow";

const NOW = new Date("2026-09-17T10:00:00.000Z");

function makeRow(overrides: Partial<FocusSessionRow> = {}): FocusSessionRow {
  return {
    id: "session-1",
    mission_id: "mission-1",
    started_at: "2026-09-17T09:30:00.000Z",
    ended_at: null,
    missions: { title: "코테 2문제", deadline: "2026-09-17T12:00:00.000Z", duration_min: 30 },
    ...overrides,
  };
}

describe("toFocusSession", () => {
  it("행이 없으면 idle 상태의 빈 세션을 반환한다", () => {
    expect(toFocusSession([], NOW)).toEqual({
      id: null,
      missionId: null,
      missionTitle: null,
      targetMinutes: 0,
      elapsedSeconds: 0,
      status: "idle",
      deadlineLabel: null,
    });
  });

  it("ended_at이 없는 최신 행이면 running이고 now까지 경과 시간을 센다", () => {
    const session = toFocusSession([makeRow()], NOW);

    expect(session.status).toBe("running");
    expect(session.elapsedSeconds).toBe(30 * 60);
    expect(session.missionTitle).toBe("코테 2문제");
    expect(session.targetMinutes).toBe(30);
  });

  it("ended_at이 있는 최신 행이면 idle이고 기록된 구간만큼만 센다 (DB 누적 집중시간)", () => {
    const session = toFocusSession(
      [makeRow({ started_at: "2026-09-17T09:00:00.000Z", ended_at: "2026-09-17T09:20:00.000Z" })],
      NOW,
    );

    expect(session.status).toBe("idle");
    expect(session.elapsedSeconds).toBe(20 * 60);
  });

  it("같은 미션의 여러 세그먼트 시간을 합산한다", () => {
    const rows = [
      makeRow({ id: "s3", started_at: "2026-09-17T09:50:00.000Z", ended_at: null }),
      makeRow({ id: "s2", started_at: "2026-09-17T09:20:00.000Z", ended_at: "2026-09-17T09:30:00.000Z" }),
      makeRow({ id: "s1", started_at: "2026-09-17T09:00:00.000Z", ended_at: "2026-09-17T09:10:00.000Z" }),
    ];

    const session = toFocusSession(rows, NOW);

    expect(session.elapsedSeconds).toBe(10 * 60 + 10 * 60 + 10 * 60);
    expect(session.id).toBe("s3");
  });

  it("다른 미션의 과거 세그먼트는 합산에서 제외한다", () => {
    const rows = [
      makeRow({ id: "s2", mission_id: "mission-2", started_at: "2026-09-17T09:50:00.000Z", ended_at: null, missions: null }),
      makeRow({ id: "s1", mission_id: "mission-1", started_at: "2026-09-17T09:00:00.000Z", ended_at: "2026-09-17T09:10:00.000Z" }),
    ];

    const session = toFocusSession(rows, NOW);

    expect(session.elapsedSeconds).toBe(10 * 60);
    expect(session.missionId).toBe("mission-2");
    expect(session.missionTitle).toBeNull();
  });
});

describe("formatDeadlineLabel", () => {
  it("남은 시간이 있으면 Nh Nm 형태로 반환한다", () => {
    expect(formatDeadlineLabel("2026-09-17T12:18:00.000Z", NOW)).toBe("2h 18m");
  });

  it("1시간 미만이면 분만 표시한다", () => {
    expect(formatDeadlineLabel("2026-09-17T10:18:00.000Z", NOW)).toBe("18m");
  });

  it("마감이 지났으면 마감을 반환한다", () => {
    expect(formatDeadlineLabel("2026-09-17T09:00:00.000Z", NOW)).toBe("마감");
  });
});
