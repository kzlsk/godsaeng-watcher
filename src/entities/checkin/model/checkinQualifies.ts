export function isQualifyingCheckin(row: { applications: number | null; problems: number | null }): boolean {
  return (row.applications ?? 0) > 0 || (row.problems ?? 0) > 0;
}
