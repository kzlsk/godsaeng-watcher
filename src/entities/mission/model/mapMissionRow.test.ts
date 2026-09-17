import { describe, expect, it } from "vitest";
import { toMission, type MissionRow } from "./mapMissionRow";

function makeRow(overrides: Partial<MissionRow> = {}): MissionRow {
  return {
    id: "mission-1",
    category: "코테",
    title: "이분 탐색 2문제",
    deadline: "13:00",
    urgent: true,
    done: false,
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
        deadline: "13:00",
        urgent: true,
        done: false,
      }),
    );

    expect(mission).toMatchObject({
      id: "mission-1",
      topic: "코테",
      todo: "이분 탐색 2문제",
      deadline: "13:00",
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
    );

    expect(mission.topic).toBe("");
    expect(mission.deadline).toBe("");
    expect(mission.isImportant).toBe(false);
    expect(mission.isCompleted).toBe(false);
  });

  it("focus_sessions가 없으면(undefined) actualFocusMinutes는 0이다", () => {
    const mission = toMission(makeRow({ focus_sessions: undefined }));

    expect(mission.actualFocusMinutes).toBe(0);
  });

  it("focus_sessions가 null이면 actualFocusMinutes는 0이다", () => {
    const mission = toMission(makeRow({ focus_sessions: null }));

    expect(mission.actualFocusMinutes).toBe(0);
  });

  it("focus_sessions가 빈 배열이면 actualFocusMinutes는 0이다", () => {
    const mission = toMission(makeRow({ focus_sessions: [] }));

    expect(mission.actualFocusMinutes).toBe(0);
  });

  it("focus_sessions가 1건이면 그 duration_min을 그대로 반환한다", () => {
    const mission = toMission(makeRow({ focus_sessions: [{ duration_min: 25 }] }));

    expect(mission.actualFocusMinutes).toBe(25);
  });

  it("focus_sessions가 여러 건이면 duration_min을 모두 합산한다", () => {
    const mission = toMission(
      makeRow({
        focus_sessions: [{ duration_min: 25 }, { duration_min: 10 }, { duration_min: 30 }],
      }),
    );

    expect(mission.actualFocusMinutes).toBe(65);
  });

  it("duration_min이 null인 세션은 0으로 취급해 합산한다", () => {
    const mission = toMission(
      makeRow({
        focus_sessions: [{ duration_min: 20 }, { duration_min: null }, { duration_min: 15 }],
      }),
    );

    expect(mission.actualFocusMinutes).toBe(35);
  });
});
