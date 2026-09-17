export interface IntensityBand {
  min: number;
  max: number;
  directive: string;
}

export interface ParsedIntensityScale {
  bands: IntensityBand[];
  hardRules: string;
}

const HARD_RULES_HEADING = "절대 금지";

export function parseIntensityScale(source: string): ParsedIntensityScale {
  const sections = source.split(/^##\s+/m).slice(1);
  const bands: IntensityBand[] = [];
  let hardRules = "";

  for (const section of sections) {
    const [headingLine, ...rest] = section.split("\n");
    const heading = headingLine.trim();
    const body = rest.join("\n").trim();

    const rangeMatch = heading.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      bands.push({ min: Number(rangeMatch[1]), max: Number(rangeMatch[2]), directive: body });
    } else if (heading.includes(HARD_RULES_HEADING)) {
      hardRules = body;
    }
  }

  return { bands, hardRules };
}

export function clampIntensity(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function pickIntensityDirective(
  scale: ParsedIntensityScale,
  intensity: number,
): { directive: string; hardRules: string } {
  const clamped = clampIntensity(intensity);
  const band =
    scale.bands.find((item) => clamped >= item.min && clamped <= item.max) ??
    scale.bands[Math.floor(scale.bands.length / 2)];

  return { directive: band?.directive ?? "", hardRules: scale.hardRules };
}
