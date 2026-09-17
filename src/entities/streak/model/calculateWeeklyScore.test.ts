import { describe, expect, it } from "vitest";
import { calculateWeeklyScore } from "./calculateWeeklyScore";

describe("calculateWeeklyScore", () => {
  it("7일 중 체크인한 날의 비율을 0~100 점수로 반환한다", () => {
    const dates = ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-20"]; // 월,화,수,일 (4/7)
    expect(calculateWeeklyScore(dates, "2026-09-14")).toBe(57); // round(4/7*100)
  });

  it("한 주 전부 체크인했으면 100점이다", () => {
    const dates = ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20"];
    expect(calculateWeeklyScore(dates, "2026-09-14")).toBe(100);
  });

  it("체크인이 하나도 없으면 0점이다", () => {
    expect(calculateWeeklyScore([], "2026-09-14")).toBe(0);
  });

  it("weekStart 범위 밖 날짜는 계산에서 제외한다", () => {
    const dates = ["2026-09-13", "2026-09-21"]; // 지난주 일요일, 다음주 월요일
    expect(calculateWeeklyScore(dates, "2026-09-14")).toBe(0);
  });
});
