// 고정 시나리오 × 4개 페르소나 × 강도 5구간으로 프롬프트 조립과 폴백을 오프라인에서 재검증한다.
// 실제 모델 출력 검증은 nagScenarios.live.test.ts (RUN_LIVE_SCENARIOS=1 일 때만 실행).
import { describe, expect, it } from "vitest";
import { NAG_PERSONAS } from "@/shared/config/personas";
import { buildNagPrompt } from "@/shared/lib/ai/buildNagPrompt";
import { FAIL_FALLBACK_MESSAGES, SUCCESS_FALLBACK_MESSAGES, pickFallbackMessage } from "@/shared/lib/ai/fallbackMessages";
import { loadPersonaPrompt } from "@/shared/lib/ai/promptLibrary";
import { parseEndingExpressions } from "@/shared/lib/ai/structureHints";
import { INTENSITY_SAMPLES, NAG_SCENARIOS, SCENARIO_NOW } from "./nagScenarios";

const REQUIRED_PERSONA_SECTIONS = ["## 정체성", "## 말투", "## 문장 구조 다양성", "## 종결 표현", "## 금지"];

describe("scenarios: persona prompt files", () => {
  it.each(NAG_PERSONAS.map((persona) => [persona.id, persona.name] as const))(
    "%s has the shared persona file structure",
    (personaId, name) => {
      const source = loadPersonaPrompt(personaId);
      expect(source).toContain(name);
      for (const section of REQUIRED_PERSONA_SECTIONS) {
        expect(source, `${personaId}에 ${section} 섹션이 없음`).toContain(section);
      }
      expect(parseEndingExpressions(source).length).toBeGreaterThanOrEqual(5);
    },
  );

  it("furious-boss is written in 존댓말 and disappointed-senior in calm 반말", () => {
    expect(loadPersonaPrompt("furious-boss")).toMatch(/반드시 존댓말을 쓴다/);
    expect(loadPersonaPrompt("disappointed-senior")).toMatch(/차분한 반말/);
  });
});

describe("scenarios: prompt assembly", () => {
  for (const scenario of NAG_SCENARIOS) {
    it(`${scenario.label} — every persona builds a prompt at every intensity band`, () => {
      for (const persona of NAG_PERSONAS) {
        for (const intensity of INTENSITY_SAMPLES) {
          const { system, user } = buildNagPrompt(
            { ...scenario.input, personaId: persona.id, intensity },
            { now: SCENARIO_NOW, random: () => 0.42 },
          );
          expect(system).toContain(persona.name);
          expect(system).toContain(`## 강도 (intensity=${intensity})`);
          expect(system).toMatch(/### 상황별 톤/);
          expect(system).toMatch(/욕설, 비속어, 인신공격/);
          expect(user).toContain(`${scenario.input.completedCount}/${scenario.input.totalCount}`);
        }
      }
    });
  }

  it("each intensity band injects a different situational guide", () => {
    const scenario = NAG_SCENARIOS[1];
    const systems = INTENSITY_SAMPLES.map(
      (intensity) =>
        buildNagPrompt({ ...scenario.input, personaId: "disappointed-senior", intensity }, { now: SCENARIO_NOW, random: () => 0.42 })
          .system,
    );
    expect(new Set(systems).size).toBe(INTENSITY_SAMPLES.length);
  });

  it("calls out the job application mission when it is pending", () => {
    const scenario = NAG_SCENARIOS.find((item) => item.id === "job-application-pending")!;
    const { user } = buildNagPrompt(
      { ...scenario.input, personaId: "disappointed-senior", intensity: 60 },
      { now: SCENARIO_NOW },
    );
    expect(user).toMatch(/공고 지원서 제출 \(마감 지남\)/);
  });
});

describe("scenarios: fallback", () => {
  it("every persona has fail and success fallback pools", () => {
    for (const persona of NAG_PERSONAS) {
      expect(FAIL_FALLBACK_MESSAGES[persona.id].length).toBeGreaterThan(0);
      expect(SUCCESS_FALLBACK_MESSAGES[persona.id].length).toBeGreaterThan(0);
      expect(typeof pickFallbackMessage("fail", persona.id)).toBe("string");
      expect(typeof pickFallbackMessage("success", persona.id)).toBe("string");
    }
  });

  it("disappointed-senior fallbacks stay calm (no exclamation marks)", () => {
    for (const quote of [...FAIL_FALLBACK_MESSAGES["disappointed-senior"], ...SUCCESS_FALLBACK_MESSAGES["disappointed-senior"]]) {
      expect(quote).not.toContain("!");
    }
  });
});
