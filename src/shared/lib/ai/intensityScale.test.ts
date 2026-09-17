import { describe, expect, it } from "vitest";
import { clampIntensity, parseIntensityScale, pickIntensityDirective } from "./intensityScale";

const SAMPLE_SOURCE = `# 강도 스케일

## 0-20

낮은 강도 지시문.

## 21-40

중간 낮은 강도 지시문.

## 41-60

기본 강도 지시문.

## 61-80

중간 높은 강도 지시문.

## 81-100

높은 강도 지시문.

## 절대 금지

공통 세이프티 규칙.`;

describe("intensityScale", () => {
  it("parseIntensityScale extracts bands and hard rules", () => {
    const parsed = parseIntensityScale(SAMPLE_SOURCE);

    expect(parsed.bands.length).toBe(5);
    expect(parsed.bands[0]).toEqual({ min: 0, max: 20, directive: "낮은 강도 지시문." });
    expect(parsed.hardRules).toBe("공통 세이프티 규칙.");
  });

  it("pickIntensityDirective selects the band containing the value", () => {
    const parsed = parseIntensityScale(SAMPLE_SOURCE);

    expect(pickIntensityDirective(parsed, 10).directive).toBe("낮은 강도 지시문.");
    expect(pickIntensityDirective(parsed, 50).directive).toBe("기본 강도 지시문.");
    expect(pickIntensityDirective(parsed, 95).directive).toBe("높은 강도 지시문.");
  });

  it("pickIntensityDirective always includes the hard-rules text regardless of band", () => {
    const parsed = parseIntensityScale(SAMPLE_SOURCE);

    for (const intensity of [0, 30, 50, 70, 100]) {
      expect(pickIntensityDirective(parsed, intensity).hardRules).toBe("공통 세이프티 규칙.");
    }
  });

  it("clampIntensity clamps out-of-range and non-finite values", () => {
    expect(clampIntensity(-10)).toBe(0);
    expect(clampIntensity(150)).toBe(100);
    expect(clampIntensity(Number.NaN)).toBe(50);
    expect(clampIntensity(42.6)).toBe(43);
  });
});
