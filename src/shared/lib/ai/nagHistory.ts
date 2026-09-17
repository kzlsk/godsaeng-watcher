import type { NagPersonaId } from "@/shared/config/personas";

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
