import { describe, expect, it } from "vitest";
import { describeIntensity } from "./describeIntensity";

describe("describeIntensity", () => {
  it("intensity-scale.md 구간 경계(20/40/60/80)에 맞춰 라벨을 고른다", () => {
    expect(describeIntensity(0)).toBe("담백하게");
    expect(describeIntensity(20)).toBe("담백하게");
    expect(describeIntensity(21)).toBe("절제해서");
    expect(describeIntensity(50)).toBe("기본");
    expect(describeIntensity(61)).toBe("세게");
    expect(describeIntensity(81)).toBe("최대로");
    expect(describeIntensity(100)).toBe("최대로");
  });
});
