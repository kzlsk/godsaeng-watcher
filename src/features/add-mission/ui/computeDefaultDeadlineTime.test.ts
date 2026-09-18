import { describe, expect, it } from "vitest";
import { computeDefaultDeadlineTime } from "@/features/add-mission/ui/computeDefaultDeadlineTime";

describe("computeDefaultDeadlineTime", () => {
  it("14:37이면 다음 정각인 15:00을 기본값으로 준다", () => {
    expect(computeDefaultDeadlineTime(new Date(2024, 0, 15, 14, 37))).toEqual({
      hour: 15,
      minute: 0,
    });
  });

  it("14:05이면 다음 30분 단위인 14:30을 기본값으로 준다", () => {
    expect(computeDefaultDeadlineTime(new Date(2024, 0, 15, 14, 5))).toEqual({
      hour: 14,
      minute: 30,
    });
  });

  it("이미 30분 단위(14:30)면 그대로 유지한다", () => {
    expect(computeDefaultDeadlineTime(new Date(2024, 0, 15, 14, 30))).toEqual({
      hour: 14,
      minute: 30,
    });
  });

  it("23:45처럼 자정에 가까우면 다음날로 넘어가지 않고 23:50으로 고정한다", () => {
    expect(computeDefaultDeadlineTime(new Date(2024, 0, 15, 23, 45))).toEqual({
      hour: 23,
      minute: 50,
    });
  });

  it("23:50이면 그대로 23:50을 유지한다", () => {
    expect(computeDefaultDeadlineTime(new Date(2024, 0, 15, 23, 50))).toEqual({
      hour: 23,
      minute: 50,
    });
  });
});
