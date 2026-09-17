import { describe, expect, it } from "vitest";
import { getTodayDateString, getWeekStartDateString } from "./date";

describe("getTodayDateString", () => {
  it("Date를 YYYY-MM-DD(UTC) 문자열로 변환한다", () => {
    expect(getTodayDateString(new Date("2026-09-17T15:30:00.000Z"))).toBe("2026-09-17");
  });
});

describe("getWeekStartDateString", () => {
  it("목요일 기준으로 그 주 월요일을 반환한다", () => {
    expect(getWeekStartDateString(new Date("2026-09-17T15:30:00.000Z"))).toBe("2026-09-14");
  });

  it("일요일이면 지난 월요일을 반환한다", () => {
    expect(getWeekStartDateString(new Date("2026-09-20T15:30:00.000Z"))).toBe("2026-09-14");
  });

  it("월요일이면 당일을 반환한다", () => {
    expect(getWeekStartDateString(new Date("2026-09-14T00:00:00.000Z"))).toBe("2026-09-14");
  });
});
