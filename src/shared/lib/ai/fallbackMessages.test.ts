import { describe, expect, it } from "vitest";
import { FAIL_FALLBACK_MESSAGES, SUCCESS_FALLBACK_MESSAGES, pickFallbackMessage } from "./fallbackMessages";
import { NAG_PERSONAS } from "@/shared/config/personas";

const AGGRESSIVE_PATTERN = /(씨발|병신|미친|죽어|꺼져|한심|무능)/;

describe("fallbackMessages", () => {
  it("contains no aggressive or abusive phrasing in any pool", () => {
    for (const pool of [FAIL_FALLBACK_MESSAGES, SUCCESS_FALLBACK_MESSAGES]) {
      for (const persona of NAG_PERSONAS) {
        for (const message of pool[persona.id]) {
          expect(message, `"${message}"에 공격적인 표현이 있음`).not.toMatch(AGGRESSIVE_PATTERN);
        }
      }
    }
  });

  it("pickFallbackMessage avoids the excluded quote when alternatives exist", () => {
    const pool = FAIL_FALLBACK_MESSAGES.realist;
    const exclude = pool.slice(0, pool.length - 1);

    for (let i = 0; i < 20; i += 1) {
      const picked = pickFallbackMessage("fail", "realist", exclude);
      expect(picked).toBe(pool[pool.length - 1]);
    }
  });

  it("pickFallbackMessage still returns a value when the whole pool is excluded", () => {
    const pool = SUCCESS_FALLBACK_MESSAGES["furious-boss"];
    const picked = pickFallbackMessage("success", "furious-boss", [...pool]);
    expect(pool).toContain(picked);
  });
});
