import { describe, expect, it } from "vitest";
import {
  formatMissionLabel,
  MAX_MISSIONS_IN_PROMPT,
  selectMissionsForPrompt,
  TRIMMED_MISSION_COUNT,
  type NagPendingMission,
} from "./pendingMissions";

const NOW = new Date("2026-09-29T12:00:00.000Z");

describe("selectMissionsForPrompt", () => {
  it("passes every mission through when there are 5 or fewer", () => {
    const missions = Array.from({ length: MAX_MISSIONS_IN_PROMPT }, (_, index) => ({ title: `미션 ${index}` }));
    expect(selectMissionsForPrompt(missions)).toEqual(missions);
  });

  it("drops blank titles", () => {
    expect(selectMissionsForPrompt([{ title: "  " }, { title: "회고 쓰기" }])).toEqual([{ title: "회고 쓰기" }]);
  });

  it("keeps only the 2 most urgent by deadline when there are more than 5", () => {
    const missions: NagPendingMission[] = [
      { title: "마감 없음 A", deadline: null },
      { title: "모레 마감", deadline: "2026-10-01T09:00:00.000Z" },
      { title: "이미 지난 마감", deadline: "2026-09-29T08:00:00.000Z" },
      { title: "마감 없음 B", deadline: null, urgent: true },
      { title: "오늘 저녁 마감", deadline: "2026-09-29T20:00:00.000Z" },
      { title: "내일 마감", deadline: "2026-09-30T09:00:00.000Z" },
    ];

    const selected = selectMissionsForPrompt(missions);
    expect(selected).toHaveLength(TRIMMED_MISSION_COUNT);
    expect(selected.map((mission) => mission.title)).toEqual(["이미 지난 마감", "오늘 저녁 마감"]);
  });

  it("prefers urgent missions when no deadlines exist", () => {
    const missions: NagPendingMission[] = Array.from({ length: 6 }, (_, index) => ({
      title: `미션 ${index}`,
      urgent: index === 4,
    }));
    expect(selectMissionsForPrompt(missions)[0].title).toBe("미션 4");
  });
});

describe("formatMissionLabel", () => {
  it("combines topic and title, and marks overdue missions", () => {
    expect(
      formatMissionLabel({ title: "이분 탐색 2문제", topic: "코테", deadline: "2026-09-29T08:00:00.000Z" }, NOW),
    ).toBe("[코테 - 이분 탐색 2문제 (마감 지남)]");
  });

  it("uses only the title when there is no topic or deadline", () => {
    expect(formatMissionLabel({ title: "회고 쓰기", topic: "" }, NOW)).toBe("[회고 쓰기]");
    expect(formatMissionLabel({ title: "회고 쓰기", deadline: "2026-09-30T08:00:00.000Z" }, NOW)).toBe("[회고 쓰기]");
  });
});
