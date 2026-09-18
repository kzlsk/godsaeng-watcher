import { describe, expect, it } from "vitest";
import { calculatePotentialStreak } from "./calculatePotentialStreak";

describe("calculatePotentialStreak", () => {
  it("오늘이 아직 pending이면 currentStreak + 1을 반환한다", () => {
    expect(calculatePotentialStreak(3, true)).toBe(4);
  });

  it("오늘이 이미 체크인됐으면(pending 아님) currentStreak를 그대로 반환한다", () => {
    expect(calculatePotentialStreak(4, false)).toBe(4);
  });

  it("currentStreak가 0이고 pending이면 1을 반환한다", () => {
    expect(calculatePotentialStreak(0, true)).toBe(1);
  });
});
