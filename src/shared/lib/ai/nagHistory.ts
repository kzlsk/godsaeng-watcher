import type { NagPersonaId } from "@/shared/config/personas";

// prompt의 "반복 금지" 힌트와 폴백 문구 선택 시 제외 목록으로만 쓰인다(둘 다 완화된 용도).
// OpenAI 응답이 "진짜 연속 중복"인지 판단하는 건 callOpenAI.ts에서 이 히스토리 전체가
// 아니라 가장 최근 문구 1개와만 비교한다 — 페르소나·모드당 폴백 풀이 4개뿐이라, 5개
// 전체(폴백 문구 포함)와 비교하면 폴백이 한 번 섞이는 순간부터 정상 응답까지 계속
// "중복"으로 오판하는 문제가 있었다.
const HISTORY_LIMIT = 5;

declare global {
  var __nagQuoteHistory: Map<string, string[]> | undefined;
}

function getStore(): Map<string, string[]> {
  if (!globalThis.__nagQuoteHistory) {
    globalThis.__nagQuoteHistory = new Map();
  }
  return globalThis.__nagQuoteHistory;
}

function keyFor(mode: "fail" | "success", personaId: NagPersonaId): string {
  return `${mode}:${personaId}`;
}

export function getRecentQuotes(mode: "fail" | "success", personaId: NagPersonaId): string[] {
  return getStore().get(keyFor(mode, personaId)) ?? [];
}

export function recordQuote(mode: "fail" | "success", personaId: NagPersonaId, quote: string): void {
  const store = getStore();
  const key = keyFor(mode, personaId);
  const list = [quote, ...(store.get(key) ?? [])].slice(0, HISTORY_LIMIT);
  store.set(key, list);
}
