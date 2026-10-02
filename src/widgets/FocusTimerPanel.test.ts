import { describe, expect, it } from "vitest";
import { computeElapsedSeconds } from "./FocusTimerPanel";

const T0 = new Date("2026-10-02T09:00:00.000Z").getTime();

describe("computeElapsedSeconds", () => {
  it("멈춰 있으면(runningSinceMs === null) 시간이 흘러도 baseSeconds에 고정된다", () => {
    const anchor = { baseSeconds: 174, runningSinceMs: null };

    expect(computeElapsedSeconds(anchor, T0)).toBe(174);
    expect(computeElapsedSeconds(anchor, T0 + 10 * 60_000)).toBe(174);
  });

  it("흐르는 중이면 기준 시각 이후 실제로 지난 시간을 더한다", () => {
    const anchor = { baseSeconds: 174, runningSinceMs: T0 };

    expect(computeElapsedSeconds(anchor, T0)).toBe(174);
    expect(computeElapsedSeconds(anchor, T0 + 1_000)).toBe(175);
  });

  it("틱을 몇 번 놓쳤든(백그라운드 탭 쓰로틀링) 복귀 시 실제 경과 시간과 일치한다", () => {
    // 2:54에 탭을 떠나 10분 뒤 복귀 → 12:54여야 한다 (누적 방식에서는 2:55로 보였다).
    const anchor = { baseSeconds: 174, runningSinceMs: T0 };

    expect(computeElapsedSeconds(anchor, T0 + 10 * 60_000)).toBe(174 + 600);
  });

  it("1초 미만의 나머지는 내림한다 (시계가 앞서 보이지 않게)", () => {
    const anchor = { baseSeconds: 0, runningSinceMs: T0 };

    expect(computeElapsedSeconds(anchor, T0 + 999)).toBe(0);
    expect(computeElapsedSeconds(anchor, T0 + 1_999)).toBe(1);
  });

  it("시스템 시계가 뒤로 조정돼도 경과 시간이 줄지 않는다", () => {
    const anchor = { baseSeconds: 60, runningSinceMs: T0 };

    expect(computeElapsedSeconds(anchor, T0 - 5_000)).toBe(60);
  });
});
