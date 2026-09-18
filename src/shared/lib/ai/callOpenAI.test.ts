import { beforeEach, describe, expect, it } from "vitest";
import { generateNagMessage } from "./callOpenAI";
import { FAIL_FALLBACK_MESSAGES, SUCCESS_FALLBACK_MESSAGES } from "./fallbackMessages";
import { recordQuote } from "./nagHistory";
import type { NagPromptContext } from "./buildNagPrompt";

// nagHistory는 globalThis에 상태를 들고 있어서(같은 mode/personaId 키를 여러 테스트가
// 공유), 테스트마다 깨끗한 상태에서 시작하도록 매번 초기화한다.
beforeEach(() => {
  globalThis.__nagQuoteHistory = new Map();
});

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

  it("서로 다른 OpenAI 응답을 여러 번 연속으로 받으면 매번 그대로 사용한다(불필요한 폴백 전환 없음)", async () => {
    await withEnv("OPENAI_API_KEY", "test-key", async () => {
      const context = baseContext({ personaId: "realist", mode: "fail" });
      const responses = ["새 문구 1", "새 문구 2", "새 문구 3", "새 문구 4", "새 문구 5"];
      let call = 0;

      await withFetch(
        (async () => {
          const content = responses[call];
          call += 1;
          return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
        }) as unknown as typeof fetch,
        async () => {
          const sequential: string[] = [];
          for (let i = 0; i < responses.length; i += 1) {
            sequential.push(await generateNagMessage(context));
          }

          expect(sequential).toEqual(responses);
        },
      );
    });
  });

  it("과거에 폴백 문구가 히스토리에 섞여 있어도, 그 다음에 오는 새로운 OpenAI 응답을 폴백으로 되돌리지 않는다", async () => {
    // "폴백이 한 번 섞이면 이후 정상 응답까지 계속 중복으로 오판하는 악순환"이 재현되지
    // 않는지 확인하는 회귀 테스트. history(최대 5개)에는 "예전에 실제로 나갔던 문구"와
    // "그보다 더 예전에 폴백으로 나갔던 문구"가 같이 들어있는 상태를 만들고, 이번에
    // OpenAI가 그 "더 예전 폴백" 문구와 우연히 같은 내용을 반환해도(직전 문구는 아님)
    // 정상적으로 받아들여지는지 확인한다. (직전 문구와만 비교하는 수정 전 코드로 되돌리면
    // history 전체와 비교하게 되어 이 테스트가 실패하는 것도 별도로 확인했음.)
    recordQuote("fail", "realist", FAIL_FALLBACK_MESSAGES.realist[0]); // 더 예전 폴백
    recordQuote("fail", "realist", "그 다음에 실제로 나갔던 문구"); // 가장 최근(직전) 문구

    await withEnv("OPENAI_API_KEY", "test-key", async () => {
      const context = baseContext({ personaId: "realist", mode: "fail" });

      await withFetch(
        // 직전 문구가 아니라, 더 예전에 폴백으로 나갔던 문구와 우연히 겹치는 응답.
        (async () =>
          new Response(
            JSON.stringify({ choices: [{ message: { content: FAIL_FALLBACK_MESSAGES.realist[0] } }] }),
            { status: 200 },
          )) as unknown as typeof fetch,
        async () => {
          const quote = await generateNagMessage(context);
          expect(quote).toBe(FAIL_FALLBACK_MESSAGES.realist[0]);
        },
      );
    });
  });

  it("진짜 완전히 똑같은 문구가 연속으로 나오는 경우에만 폴백으로 전환한다", async () => {
    await withEnv("OPENAI_API_KEY", "test-key", async () => {
      const context = baseContext({ personaId: "realist", mode: "fail" });

      await withFetch(
        // 매 호출마다 완전히 동일한 문구를 반환 — 진짜 연속 중복 상황을 흉내낸다.
        (async () => new Response(JSON.stringify({ choices: [{ message: { content: "반복 문구" } }] }), { status: 200 })) as unknown as typeof fetch,
        async () => {
          const first = await generateNagMessage(context);
          const second = await generateNagMessage(context);

          expect(first).toBe("반복 문구");
          expect(second).not.toBe("반복 문구"); // 중복 감지로 폴백 전환됨
          expect(FAIL_FALLBACK_MESSAGES.realist).toContain(second);
        },
      );
    });
  });
});
