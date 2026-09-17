import { describe, expect, it } from "vitest";
import { getTodayRange, getWeekRange } from "./dateRange";

describe("getTodayRange", () => {
  it("UTC 기준 오늘 00:00 ~ 다음날 00:00 범위를 반환한다", () => {
    const range = getTodayRange(new Date("2026-09-17T15:30:00.000Z"));

    expect(range.start).toBe("2026-09-17T00:00:00.000Z");
    expect(range.end).toBe("2026-09-18T00:00:00.000Z");
  });
});

describe("getWeekRange", () => {
  it("목요일 기준으로 그 주 월요일 00:00 ~ 다음 월요일 00:00 범위를 반환한다", () => {
    const range = getWeekRange(new Date("2026-09-17T15:30:00.000Z")); // 2026-09-17은 목요일

    expect(range.start).toBe("2026-09-14T00:00:00.000Z");
    expect(range.end).toBe("2026-09-21T00:00:00.000Z");
  });

  it("일요일이면 지난 월요일부터 시작한다", () => {
    const range = getWeekRange(new Date("2026-09-20T15:30:00.000Z")); // 2026-09-20은 일요일

    expect(range.start).toBe("2026-09-14T00:00:00.000Z");
    expect(range.end).toBe("2026-09-21T00:00:00.000Z");
  });

  it("월요일이면 당일부터 시작한다", () => {
    const range = getWeekRange(new Date("2026-09-14T00:00:00.000Z"));

    expect(range.start).toBe("2026-09-14T00:00:00.000Z");
    expect(range.end).toBe("2026-09-21T00:00:00.000Z");
  });
});
