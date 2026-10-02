import { describe, expect, it } from "vitest";
import { formatClock } from "./TimerDisplay";

describe("formatClock", () => {
  it("60분 미만은 MM:SS로 포맷한다", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(9)).toBe("00:09");
    expect(formatClock(174)).toBe("02:54");
    expect(formatClock(59 * 60 + 59)).toBe("59:59");
  });

  it("정확히 60분이면 시 자리가 붙는다", () => {
    expect(formatClock(60 * 60)).toBe("1:00:00");
  });

  it("60분 이상은 H:MM:SS로 포맷한다 (분이 60을 넘어 흐르지 않는다)", () => {
    // 수정 전에는 "125:03"으로 나오던 값.
    expect(formatClock(125 * 60 + 3)).toBe("2:05:03");
    expect(formatClock(10 * 3600 + 2 * 60 + 1)).toBe("10:02:01");
  });

  it("음수/소수가 들어와도 표시가 깨지지 않는다", () => {
    expect(formatClock(-5)).toBe("00:00");
    expect(formatClock(90.9)).toBe("01:30");
  });
});
