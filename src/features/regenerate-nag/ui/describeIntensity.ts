export const DEFAULT_NAG_INTENSITY = 50;

// prompts/intensity-scale.md의 구간과 같은 경계로 슬라이더 옆 라벨을 보여준다.
const INTENSITY_LABELS: { max: number; label: string }[] = [
  { max: 20, label: "담백하게" },
  { max: 40, label: "절제해서" },
  { max: 60, label: "기본" },
  { max: 80, label: "세게" },
  { max: 100, label: "최대로" },
];

export function describeIntensity(value: number): string {
  return INTENSITY_LABELS.find((item) => value <= item.max)?.label ?? INTENSITY_LABELS[INTENSITY_LABELS.length - 1].label;
}
