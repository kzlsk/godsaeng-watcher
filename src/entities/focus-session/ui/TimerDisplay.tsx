function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimerDisplay({ seconds }: { seconds: number }) {
  return (
    <div className="py-1 text-center text-[39px] font-extrabold tracking-tight text-ink">
      {formatClock(seconds)}
    </div>
  );
}
