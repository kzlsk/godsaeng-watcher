import { describe, expect, it } from "vitest";
import { calculateOverdueDays } from "./calculateOverdueDays";

describe("calculateOverdueDays", () => {
  it("deadline이 없으면 0을 반환한다", () => {
    expect(calculateOverdueDays("", "2026-09-18")).toBe(0);
  });

  it("deadline이 오늘이면 0을 반환한다(아직 지연 아님)", () => {
    const deadline = new Date("2026-09-18T09:00:00.000Z").toISOString(); // KST 18:00, 오늘=09-18
    expect(calculateOverdueDays(deadline, "2026-09-18")).toBe(0);
  });

  it("deadline이 미래면 0을 반환한다", () => {
    const deadline = new Date("2026-09-20T09:00:00.000Z").toISOString();
    expect(calculateOverdueDays(deadline, "2026-09-18")).toBe(0);
  });

  it("deadline이 하루 지났으면 1을 반환한다", () => {
    const deadline = new Date("2026-09-17T09:00:00.000Z").toISOString(); // 오늘=09-18 기준 하루 전
    expect(calculateOverdueDays(deadline, "2026-09-18")).toBe(1);
  });

  it("deadline이 여러 날 지났으면 그 일수를 반환한다", () => {
    const deadline = new Date("2026-09-15T09:00:00.000Z").toISOString();
    expect(calculateOverdueDays(deadline, "2026-09-18")).toBe(3);
  });

  it("deadline이 새벽 2시 컷오프 이전(전날로 판정되는 시각)이면 그만큼 지연 일수에 반영된다", () => {
    // KST 2026-09-18T01:00(컷오프 이전) == UTC 2026-09-17T16:00:00.000Z → deadline의 앱 하루는 09-17
    const deadline = "2026-09-17T16:00:00.000Z";
    expect(calculateOverdueDays(deadline, "2026-09-18")).toBe(1);
  });
});
