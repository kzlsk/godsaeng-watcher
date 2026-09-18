import { describe, expect, it } from "vitest";
import { toMission, type MissionRow } from "./mapMissionRow";

const TODAY = "2026-09-18";

function makeRow(overrides: Partial<MissionRow> = {}): MissionRow {
  return {
    id: "mission-1",
    category: "코테",
    title: "이분 탐색 2문제",
    deadline: "2026-09-18T13:00:00.000Z",
    urgent: true,
    done: false,
    created_at: "2026-09-18T00:00:00.000Z",
    focus_sessions: [],
    ...overrides,
  };
}

describe("toMission", () => {
  it("필드를 프론트 타입으로 정확히 매핑한다", () => {
    const mission = toMission(
      makeRow({
        id: "mission-1",
        category: "코테",
        title: "이분 탐색 2문제",
        deadline: "2026-09-18T13:00:00.000Z",
        urgent: true,
        done: false,
      }),
      TODAY,
    );

    expect(mission).toMatchObject({
      id: "mission-1",
      topic: "코테",
      todo: "이분 탐색 2문제",
      deadline: "2026-09-18T13:00:00.000Z",
      isImportant: true,
      isCompleted: false,
    });
  });

  it("category/deadline이 null이면 빈 문자열로, urgent/done이 null이면 false로 fallback한다", () => {
    const mission = toMission(
      makeRow({
        category: null,
        deadline: null,
        urgent: null,
        done: null,
      }),
      TODAY,
    );

    expect(mission.topic).toBe("");
    expect(mission.deadline).toBe("");
    expect(mission.isImportant).toBe(false);
    expect(mission.isCompleted).toBe(false);
  });

  it("focus_sessions가 없으면(undefined) actualFocusMinutes는 0이다", () => {
    const mission = toMission(makeRow({ focus_sessions: undefined }), TODAY);

    expect(mission.actualFocusMinutes).toBe(0);
  });

  it("focus_sessions가 null이면 actualFocusMinutes는 0이다", () => {
    const mission = toMission(makeRow({ focus_sessions: null }), TODAY);

    expect(mission.actualFocusMinutes).toBe(0);
  });

  it("focus_sessions가 빈 배열이면 actualFocusMinutes는 0이다", () => {
    const mission = toMission(makeRow({ focus_sessions: [] }), TODAY);

    expect(mission.actualFocusMinutes).toBe(0);
  });

  it("오늘 시작된 focus_sessions가 1건이면 그 duration_min을 그대로 반환한다", () => {
    const mission = toMission(
      makeRow({ focus_sessions: [{ duration_min: 25, started_at: "2026-09-18T09:00:00.000Z" }] }),
      TODAY,
    );

    expect(mission.actualFocusMinutes).toBe(25);
  });

  it("오늘 시작된 focus_sessions가 여러 건이면 duration_min을 모두 합산한다", () => {
    const mission = toMission(
      makeRow({
        focus_sessions: [
          { duration_min: 25, started_at: "2026-09-18T01:00:00.000Z" },
          { duration_min: 10, started_at: "2026-09-18T09:00:00.000Z" },
          { duration_min: 30, started_at: "2026-09-18T13:00:00.000Z" },
        ],
      }),
      TODAY,
    );

    expect(mission.actualFocusMinutes).toBe(65);
  });

  it("duration_min이 null인 세션은 0으로 취급해 합산한다", () => {
    const mission = toMission(
      makeRow({
        focus_sessions: [
          { duration_min: 20, started_at: "2026-09-18T01:00:00.000Z" },
          { duration_min: null, started_at: "2026-09-18T09:00:00.000Z" },
          { duration_min: 15, started_at: "2026-09-18T13:00:00.000Z" },
        ],
      }),
      TODAY,
    );

    expect(mission.actualFocusMinutes).toBe(35);
  });

  it("오늘(앱 하루 기준)이 아닌 날 시작된 세션은 합산에서 제외한다", () => {
    const mission = toMission(
      makeRow({
        focus_sessions: [
          { duration_min: 40, started_at: "2026-09-17T09:00:00.000Z" }, // 어제
          { duration_min: 10, started_at: "2026-09-18T09:00:00.000Z" }, // 오늘
        ],
      }),
      TODAY,
    );

    expect(mission.actualFocusMinutes).toBe(10);
  });

  it("미완료 미션은 deadline이 지난 만큼 overdueDays를 계산한다", () => {
    const mission = toMission(
      makeRow({ done: false, deadline: "2026-09-15T09:00:00.000Z" }),
      TODAY,
    );

    expect(mission.overdueDays).toBe(3);
  });

  it("deadline이 지나지 않은 미완료 미션은 overdueDays가 0이다", () => {
    const mission = toMission(
      makeRow({ done: false, deadline: "2026-09-20T09:00:00.000Z" }),
      TODAY,
    );

    expect(mission.overdueDays).toBe(0);
  });

  it("완료된 미션은 deadline이 지났어도 overdueDays가 0이다", () => {
    const mission = toMission(
      makeRow({ done: true, deadline: "2026-09-10T09:00:00.000Z" }),
      TODAY,
    );

    expect(mission.overdueDays).toBe(0);
  });

  it("today를 생략하면 현재 시각 기준 오늘로 계산한다", () => {
    const mission = toMission(makeRow({ focus_sessions: [] }));

    expect(mission.actualFocusMinutes).toBe(0);
  });
});
