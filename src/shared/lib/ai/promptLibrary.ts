import fs from "node:fs";
import path from "node:path";
import type { NagPersonaId } from "@/shared/config/personas";

const PROMPTS_ROOT = path.join(process.cwd(), "prompts");

const personaCache = new Map<NagPersonaId, string>();
let intensityScaleCache: string | null = null;

export function loadPersonaPrompt(personaId: NagPersonaId): string {
  const cached = personaCache.get(personaId);
  if (cached) return cached;

  const filePath = path.join(PROMPTS_ROOT, "personas", `${personaId}.md`);
  const content = fs.readFileSync(filePath, "utf-8").trim();
  personaCache.set(personaId, content);
  return content;
}

export function loadIntensityScaleSource(): string {
  if (intensityScaleCache) return intensityScaleCache;

  const filePath = path.join(PROMPTS_ROOT, "intensity-scale.md");
  intensityScaleCache = fs.readFileSync(filePath, "utf-8").trim();
  return intensityScaleCache;
}
