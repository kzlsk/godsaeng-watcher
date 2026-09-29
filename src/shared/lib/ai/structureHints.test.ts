import { describe, expect, it } from "vitest";
import { loadPersonaPrompt, loadStructureHintsSource } from "./promptLibrary";
import { parseEndingExpressions, parseStructureHints, resolveHintPool } from "./structureHints";

describe("parseStructureHints", () => {
  it("parses tags and keeps the text without them (CRLF safe)", () => {
    const source = "# 제목\r\n\r\n## 공용\r\n\r\n- [short] 짧게\r\n- [ends] 질문으로 끝내\r\n- 비유\r\n";
    const pools = parseStructureHints(source);

    expect(pools.get("공용")).toEqual([
      { text: "짧게", short: true, ends: false, mission: false },
      { text: "질문으로 끝내", short: false, ends: true, mission: false },
      { text: "비유", short: false, ends: false, mission: false },
    ]);
  });

  it("falls back to the common pool for personas without their own section", () => {
    const pools = parseStructureHints("## 공용\n- 공용 힌트\n## realist\n- 전용 힌트\n");

    expect(resolveHintPool(pools, "realist").map((hint) => hint.text)).toEqual(["전용 힌트"]);
    expect(resolveHintPool(pools, "furious-boss").map((hint) => hint.text)).toEqual(["공용 힌트"]);
  });
});

describe("prompts/structure-hints.md", () => {
  const pools = parseStructureHints(loadStructureHintsSource());

  it("has a common pool and a separate realist pool, each with one [short] hint", () => {
    for (const personaId of ["realist", "furious-boss", "clingy-friend"]) {
      const pool = resolveHintPool(pools, personaId);
      expect(pool.length).toBeGreaterThanOrEqual(6);
      expect(pool.filter((hint) => hint.short)).toHaveLength(1);
      expect(pool.find((hint) => hint.short)?.text).toMatch(/15자/);
    }
    expect(resolveHintPool(pools, "realist")).not.toEqual(resolveHintPool(pools, "furious-boss"));
  });

  it("realist pool has no hint that asks for an interjection or an emotional outburst", () => {
    for (const hint of resolveHintPool(pools, "realist")) {
      expect(hint.text).not.toMatch(/감탄사(나|로)|감정을 터뜨려/);
    }
  });

  it("realist pool includes the conclusion-first, two-number contrast, and plain question hints", () => {
    const texts = resolveHintPool(pools, "realist").map((hint) => hint.text).join("\n");
    expect(texts).toMatch(/결론을 먼저/);
    expect(texts).toMatch(/숫자 두 개만/);
    expect(texts).toMatch(/감탄사 없이, 담담한 질문으로/);
  });
});

describe("persona ending expressions", () => {
  it.each(["realist", "furious-boss", "clingy-friend"] as const)("%s lists at least 5 ending expressions", (personaId) => {
    const endings = parseEndingExpressions(loadPersonaPrompt(personaId));
    expect(endings.length).toBeGreaterThanOrEqual(5);
    expect(new Set(endings).size).toBe(endings.length);
  });

  it("returns an empty list when the section is missing", () => {
    expect(parseEndingExpressions("## 말투\n- 반말\n")).toEqual([]);
  });
});
