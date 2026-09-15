"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { ProgressBar } from "@/shared/ui/ProgressBar";
import { TimerDisplay } from "@/entities/focus-session/ui/TimerDisplay";
import { useFocusSession } from "@/entities/focus-session/model/useFocusSession";
import { useStartFocusSession } from "@/features/start-focus-session/model/useStartFocusSession";

export function FocusTimerPanel() {
  const { data: session } = useFocusSession();
  const startFocusSession = useStartFocusSession();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [syncedElapsedSeconds, setSyncedElapsedSeconds] = useState<number | null>(null);

  if (session && session.elapsedSeconds !== syncedElapsedSeconds) {
    setSyncedElapsedSeconds(session.elapsedSeconds);
    setElapsedSeconds(session.elapsedSeconds);
  }

  useEffect(() => {
    if (session?.status !== "running") return;
    const interval = setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [session?.status]);

  if (!session) {
    return <div className="h-57.75 w-full animate-pulse border-2 border-ink bg-surface-muted" />;
  }

  const targetSeconds = session.targetMinutes * 60;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const progress = targetSeconds === 0 ? 0 : (elapsedSeconds / targetSeconds) * 100;
  const isRunning = session.status === "running";

  return (
    <Panel className="flex w-full flex-col gap-3.25 px-5 py-4.5">
      <div className="flex items-center justify-between">
        <span className="font-display text-[18px] text-ink">집중 타이머</span>
        {session.missionTitle ? (
          <span className="text-[12px] font-semibold text-ink-soft">{session.missionTitle}</span>
        ) : null}
      </div>

      <TimerDisplay seconds={remainingSeconds} />
      <ProgressBar value={progress} />

      <div className="flex items-center justify-between text-[11.5px] font-semibold text-ink-soft">
        <span>실제 집중 {Math.floor(elapsedSeconds / 60)}분</span>
        {session.deadlineLabel ? <span>마감까지 {session.deadlineLabel}</span> : null}
      </div>

      <div className="flex gap-2">
        <Button
          variant={isRunning ? "solid" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() =>
            startFocusSession.mutate({
              missionId: session.missionId ?? undefined,
              action: session.status === "paused" ? "resume" : "start",
            })
          }
        >
          시작
        </Button>
        <Button
          variant={isRunning ? "outline" : "solid"}
          size="sm"
          className="flex-1"
          onClick={() => startFocusSession.mutate({ action: "pause" })}
        >
          일시정지
        </Button>
      </div>
    </Panel>
  );
}
