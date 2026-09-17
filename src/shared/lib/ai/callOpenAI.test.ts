import { describe, expect, it } from "vitest";
import { generateNagMessage } from "./callOpenAI";
import { FAIL_FALLBACK_MESSAGES, SUCCESS_FALLBACK_MESSAGES } from "./fallbackMessages";
import type { NagPromptContext } from "./buildNagPrompt";

function baseContext(overrides: Partial<NagPromptContext> = {}): NagPromptContext {
  return {
    mode: "fail",
    personaId: "realist",
    completedCount: 1,
    totalCount: 4,
    delayMinutesToday: 47,
    pendingMissionTitles: ["코딩 테스트"],
    ...overrides,
  };
}

function withEnv(key: string, value: string | undefined, fn: () => Promise<void>) {
  const original = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;

  return fn().finally(() => {
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  });
}

function withFetch(mock: typeof fetch, fn: () => Promise<void>) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  return fn().finally(() => {
    globalThis.fetch = original;
  });
}

describe("generateNagMessage", () => {
  it("falls back to a rule-based message when OPENAI_API_KEY is missing", async () => {
    await withEnv("OPENAI_API_KEY", undefined, async () => {
      const quote = await generateNagMessage(baseContext({ personaId: "furious-boss" }));
      expect(FAIL_FALLBACK_MESSAGES["furious-boss"]).toContain(quote);
    });
  });

  it("falls back when the OpenAI request rejects (network error/timeout)", async () => {
    await withEnv("OPENAI_API_KEY", "test-key", async () => {
      await withFetch(
        (async () => {
          throw new Error("network down");
        }) as unknown as typeof fetch,
        async () => {
          const quote = await generateNagMessage(baseContext({ personaId: "clingy-friend", mode: "success" }));
          expect(SUCCESS_FALLBACK_MESSAGES["clingy-friend"]).toContain(quote);
        },
      );
    });
  });

  it("falls back when the OpenAI response is a non-2xx status", async () => {
    await withEnv("OPENAI_API_KEY", "test-key", async () => {
      await withFetch(
        (async () => new Response("rate limited", { status: 429 })) as unknown as typeof fetch,
        async () => {
          const quote = await generateNagMessage(baseContext({ personaId: "realist" }));
          expect(FAIL_FALLBACK_MESSAGES.realist).toContain(quote);
        },
      );
    });
  });

  it("returns the sanitized OpenAI message on success", async () => {
    await withEnv("OPENAI_API_KEY", "test-key", async () => {
      await withFetch(
        (async () =>
          new Response(JSON.stringify({ choices: [{ message: { content: '"오늘도 미뤘네." ' } }] }), {
            status: 200,
          })) as unknown as typeof fetch,
        async () => {
          const quote = await generateNagMessage(baseContext({ personaId: "realist", mode: "fail" }));
          expect(quote).toBe("오늘도 미뤘네.");
        },
      );
    });
  });

  it("does not repeat the immediately preceding quote when regenerating with the same input", async () => {
    await withEnv("OPENAI_API_KEY", "test-key", async () => {
      const context = baseContext({ personaId: "realist", mode: "fail" });

      await withFetch(
        (async () =>
          new Response(JSON.stringify({ choices: [{ message: { content: "고정된 응답 문구" } }] }), {
            status: 200,
          })) as unknown as typeof fetch,
        async () => {
          const first = await generateNagMessage(context);
          const second = await generateNagMessage(context);
          expect(first).not.toBe(second);
        },
      );
    });
  });
});
