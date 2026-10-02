/*
 * 경과 시간을 시계 형태로 포맷한다.
 * - 60분 미만: MM:SS
 * - 60분 이상: H:MM:SS
 * 예전에는 분을 그대로 흘려보내서 1시간을 넘기면 "125:03"처럼 시/분 경계가
 * 사라졌다. 60분 미만에서 "0:02:54"로 바뀌면 평소 표시가 쓸데없이 길어지므로,
 * 시 자리는 실제로 1시간을 넘겼을 때만 붙인다.
 */
export function formatClock(totalSeconds: number) {
  // 음수/소수가 들어와도 표시가 깨지지 않게 먼저 정수 초로 정규화한다.
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(safeSeconds / 60) % 60;
  const seconds = safeSeconds % 60;

  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

export function TimerDisplay({ seconds }: { seconds: number }) {
  return (
    // tabular-nums: 숫자 폭을 고정해 매초 글자가 좌우로 흔들리지 않게 한다.
    // (자리수가 MM:SS ↔ H:MM:SS로 바뀔 때 특히 티가 난다)
    <div className="py-1 text-center text-[39px] font-extrabold tracking-tight tabular-nums text-ink">
      {formatClock(seconds)}
    </div>
  );
}
