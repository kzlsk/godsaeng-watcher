// prompts/structure-hints.md, prompts/personas/*.md 의 "## 종결 표현" 섹션을 파싱한다.
// 힌트 문구 자체는 코드에 두지 않고 md 파일에서 관리한다 (AGENTS.md: 프롬프트 하드코딩 금지).

export interface StructureHint {
  text: string;
  /** [short] 극단적으로 짧은 문장 힌트 */
  short: boolean;
  /** [ends] 끝맺음 방식을 스스로 정하는 힌트 — 별도 종결 표현 지시를 넣지 않는다 */
  ends: boolean;
  /** [mission] 미완료 미션이 있을 때만 후보가 되는 힌트 */
  mission: boolean;
}

export const COMMON_POOL_HEADING = "공용";
export const ENDINGS_HEADING = "종결 표현";

const TAG_PATTERN = /^\[(short|ends|mission)\]\s*/;

function splitSections(source: string): Map<string, string> {
  const sections = new Map<string, string>();
  for (const section of source.replace(/\r/g, "").split(/^##\s+/m).slice(1)) {
    const [headingLine, ...rest] = section.split("\n");
    sections.set(headingLine.trim(), rest.join("\n"));
  }
  return sections;
}

function parseBullets(body: string): string[] {
  return body
    .split("\n")
    .filter((line) => /^-\s+/.test(line))
    .map((line) => line.replace(/^-\s+/, "").trim())
    .filter(Boolean);
}

function parseHint(bullet: string): StructureHint {
  const hint: StructureHint = { text: bullet, short: false, ends: false, mission: false };
  let rest = bullet;
  let match = rest.match(TAG_PATTERN);
  while (match) {
    hint[match[1] as "short" | "ends" | "mission"] = true;
    rest = rest.slice(match[0].length);
    match = rest.match(TAG_PATTERN);
  }
  hint.text = rest.trim();
  return hint;
}

/** 섹션 이름(공용, realist 등) → 구조 힌트 목록. 태그 설명 등 머리말 섹션은 항목이 없으면 무시된다. */
export function parseStructureHints(source: string): Map<string, StructureHint[]> {
  const pools = new Map<string, StructureHint[]>();
  for (const [heading, body] of splitSections(source)) {
    const hints = parseBullets(body).map(parseHint);
    if (hints.length > 0) pools.set(heading, hints);
  }
  return pools;
}

/** 페르소나 id와 같은 이름의 섹션이 있으면 그 풀을, 없으면 공용 풀을 쓴다. */
export function resolveHintPool(pools: Map<string, StructureHint[]>, personaId: string): StructureHint[] {
  return pools.get(personaId) ?? pools.get(COMMON_POOL_HEADING) ?? [];
}

/** 페르소나 md의 "## 종결 표현" 목록 */
export function parseEndingExpressions(personaSource: string): string[] {
  return parseBullets(splitSections(personaSource).get(ENDINGS_HEADING) ?? "");
}
