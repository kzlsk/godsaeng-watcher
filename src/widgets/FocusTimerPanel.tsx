"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { TimerDisplay } from "@/entities/focus-session/ui/TimerDisplay";
import { useFocusSession } from "@/entities/focus-session/model/useFocusSession";
import { usePausedMarker, useSetPausedMarker } from "@/entities/focus-session/model/pausedMarker";
import { useStartFocusSession } from "@/features/start-focus-session/model/useStartFocusSession";
import { useMissions } from "@/entities/mission/model/useMissions";
import type { FocusSession, FocusSessionStatus } from "@/entities/focus-session/model/types";

const STATUS_LABEL: Record<FocusSessionStatus, string> = {
  idle: "대기 중",
  running: "진행 중",
  paused: "일시정지",
  stopped: "중지됨",
};

// 서버(DB)는 "일시정지"를 표현하는 컬럼이 없어 idle|running만 안다 — 일시정지는
// 순수 프론트 상태로만 존재한다.
type LocalStatus = "idle" | "running" | "paused";

/*
 * 경과 시간의 "기준점".
 * - baseSeconds: 기준 시각까지 이미 쌓인 초
 * - runningSinceMs: 기준 시각(epoch ms). 지금도 시간이 흐르는 중이면 숫자,
 *   멈춰 있으면(idle/paused) null — 이때 표시값은 baseSeconds에 고정된다.
 */
export interface ElapsedAnchor {
  baseSeconds: number;
  runningSinceMs: number | null;
}

const STOPPED_ANCHOR: ElapsedAnchor = { baseSeconds: 0, runningSinceMs: null };

/*
 * 틱마다 1씩 더해 누적하는 대신, 매번 "기준 시각과 지금의 실제 차이"로 다시 계산한다.
 * 브라우저는 백그라운드 탭의 setInterval을 쓰로틀링하고(모바일은 앱 전환/화면 잠금
 * 시 아예 멈춘다), 서버는 ended_at - started_at로 실제 시간을 기록하므로 누적
 * 방식에서는 화면만 느려지고 DB와 어긋났다. 실제 시계를 매번 다시 읽으면 그 사이
 * 몇 번의 틱을 놓쳤든 값이 항상 맞는다.
 */
export function computeElapsedSeconds(anchor: ElapsedAnchor, nowMs: number): number {
  const base = Math.max(0, anchor.baseSeconds);
  if (anchor.runningSinceMs === null) return base;

  // 시스템 시계가 뒤로 조정돼도(NTP 보정 등) 음수로 빠지지 않게 0에서 막는다.
  const sinceAnchor = Math.max(0, Math.floor((nowMs - anchor.runningSinceMs) / 1000));
  return base + sinceAnchor;
}

export function FocusTimerPanel() {
  const { data: session } = useFocusSession();
  const { data: missions = [] } = useMissions();
  const { data: pausedMarker } = usePausedMarker();
  const setPausedMarker = useSetPausedMarker();
  const updateFocusSession = useStartFocusSession();

  const [status, setLocalStatus] = useState<LocalStatus>("idle");
  const [anchor, setAnchor] = useState<ElapsedAnchor>(STOPPED_ANCHOR);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [syncedSession, setSyncedSession] = useState<FocusSession | null>(null);

  /*
   * "지금"을 1초마다 다시 읽어 화면을 갱신한다. 표시값 자체는 아래
   * computeElapsedSeconds가 기준 시각과의 실제 차이로 계산하므로, 틱이
   * 쓰로틀링되거나 아예 멈춰도 숫자가 틀리지는 않고 갱신 주기만 성겨진다.
   *
   * 타이머가 멈춰 있을 때도 끄지 않고 계속 돌린다. 아래 "서버 세션 동기화"가
   * 렌더 중에 기준 시각을 잡아야 하는데, 렌더에서 Date.now()를 부르는 건
   * 순수하지 않아(react-hooks/purity) 이 nowMs를 대신 쓴다 — 그러려면 멈춰 있는
   * 동안에도 nowMs가 1초 이상 묵으면 안 된다. 멈춰 있을 때의 리렌더는 작은 패널
   * 하나라 비용이 사실상 없다.
   */
  useEffect(() => {
    const sync = () => setNowMs(Date.now());
    const syncIfVisible = () => {
      if (document.visibilityState === "visible") sync();
    };

    const interval = setInterval(sync, 1000);
    // 돌아왔을 때 다음 틱(최대 1초)을 기다리지 않고 즉시 따라잡게 한다.
    // 브라우저마다 실제로 오는 이벤트가 달라서 셋 다 건다: visibilitychange(탭
    // 전환/화면 잠금 복귀), pageshow(모바일 사파리 bfcache 복귀 — 이때
    // visibilitychange가 오지 않는 경우가 있다), focus(창 포커스 복귀).
    document.addEventListener("visibilitychange", syncIfVisible);
    window.addEventListener("pageshow", sync);
    window.addEventListener("focus", sync);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", syncIfVisible);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  // 서버 세션이 바뀌면(초기 로드, 다른 미션의 "집중 시작" 등) 로컬 기준점으로 옮긴다.
  // 단 일시정지 마커가 남아 있는 동안은 건너뛴다 — 일시정지를 가로지르는 DB
  // 세그먼트가 아직 열려 있어서, 서버가 보고하는 elapsedSeconds에는 멈춰 있던
  // 시간까지 섞여 있기 때문. 이 마커는 다음 start/resume/stop이 성공할 때
  // useStartFocusSession의 onSuccess가 지우고, 그 직후 이 블록이 동기화한다.
  //
  // 가드 조건을 "일시정지 상태 && 마커 있음"이 아니라 마커 유무만으로 둔 이유:
  // 낙관적 재개/중지 직후에는 로컬 상태가 이미 running/idle로 바뀌었는데도 마커는
  // 아직 남아 있다(서버 응답 전). 이 구간에 서버 값이 들어오면 멈춰 있던 시간이
  // 다시 섞이므로, 로컬 상태와 무관하게 마커가 있으면 막는 쪽이 맞다.
  const isSyncBlocked = pausedMarker !== null;
  if (session && session !== syncedSession && !isSyncBlocked) {
    const isRunning = session.status === "running";

    setSyncedSession(session);
    setLocalStatus(isRunning ? "running" : "idle");
    // 기준 시각은 위 틱이 1초 안쪽으로 갱신해 둔 nowMs를 쓴다. 최대 1초까지
    // 과거일 수 있어 표시가 그만큼 앞설 수 있지만, 서버 값으로 다시 맞춰질 때마다
    // 초기화되므로 오차가 누적되지는 않는다.
    setAnchor({
      baseSeconds: session.elapsedSeconds,
      runningSinceMs: isRunning ? nowMs : null,
    });
  }

  if (!session) {
    return <div className="h-57.75 w-full animate-pulse border-2 border-line bg-surface-muted" />;
  }

  const missionId = session.missionId ?? undefined;
  const currentMission = missions.find((mission) => mission.id === session.missionId);
  const elapsedSeconds = computeElapsedSeconds(anchor, nowMs);
  const displaySeconds = currentMission?.isCompleted ? 0 : elapsedSeconds;

  /*
   * 서버 응답을 기다리지 않고 화면 상태를 먼저 바꾼다(낙관적 갱신).
   * 특히 "중지"는 응답이 올 때까지(체감 ~5초) interval이 계속 running으로 보고
   * 숫자가 흘러서 "눌렀는데 안 멈춘다"로 보였다.
   * 반환값은 롤백 함수 — 요청이 실패하면 누르기 직전 상태로 되돌린다.
   */
  function applyOptimistic(nextStatus: LocalStatus, nextAnchor: ElapsedAnchor) {
    const previousStatus = status;
    const previousAnchor = anchor;

    setLocalStatus(nextStatus);
    setAnchor(nextAnchor);
    setNowMs(Date.now());

    return () => {
      setLocalStatus(previousStatus);
      setAnchor(previousAnchor);
      setNowMs(Date.now());
    };
  }

  // 서버가 돌려준 값으로 기준점을 다시 맞춘다 (낙관적으로 추정한 값의 최종 보정).
  function settleFrom(data: FocusSession, nextStatus: LocalStatus) {
    const settledAt = Date.now();

    setLocalStatus(nextStatus);
    setAnchor({
      baseSeconds: data.elapsedSeconds,
      runningSinceMs: nextStatus === "running" ? settledAt : null,
    });
    setNowMs(settledAt);
  }

  function start() {
    const now = Date.now();
    const rollback = applyOptimistic("running", {
      baseSeconds: computeElapsedSeconds(anchor, now),
      runningSinceMs: now,
    });

    updateFocusSession.mutate(
      { missionId, action: "start" },
      {
        onSuccess: (data) => settleFrom(data, "running"),
        onError: rollback,
      },
    );
  }

  function pause() {
    // 화면이 멈추는 시각과 DB 세그먼트를 닫을 시각(pausedAt)이 어긋나지 않도록
    // 같은 now 하나로 둘 다 잡는다.
    const now = Date.now();

    setPausedMarker({ missionId: missionId ?? null, pausedAt: new Date(now).toISOString() });
    setLocalStatus("paused");
    setAnchor({ baseSeconds: computeElapsedSeconds(anchor, now), runningSinceMs: null });
  }

  function resume() {
    // 낙관적 갱신으로 status가 바뀌기 전에 읽어둔다.
    const pausedAt = pausedMarker?.pausedAt;
    const now = Date.now();
    const rollback = applyOptimistic("running", {
      baseSeconds: computeElapsedSeconds(anchor, now),
      runningSinceMs: now,
    });

    updateFocusSession.mutate(
      { missionId, action: "resume", endedAt: pausedAt },
      {
        onSuccess: (data) => settleFrom(data, "running"),
        onError: rollback,
      },
    );
  }

  function stop() {
    const endedAt = status === "paused" ? pausedMarker?.pausedAt : undefined;
    // 클릭한 순간의 값으로 화면을 바로 얼린다.
    const rollback = applyOptimistic("idle", {
      baseSeconds: computeElapsedSeconds(anchor, Date.now()),
      runningSinceMs: null,
    });

    updateFocusSession.mutate(
      { action: "stop", endedAt },
      {
        onSuccess: (data) => settleFrom(data, "idle"),
        onError: rollback,
      },
    );
  }

  // 모바일 터치 타깃 보정: sm 사이즈 버튼은 높이가 ~31px라 손가락으로 누르기엔
  // 작아서 탭이 자주 빗나갔다. 모바일에서만 44px(iOS HIG 최소 권장)로 키우고
  // 데스크톱 레이아웃은 그대로 둔다. touch-manipulation은 더블탭 확대 대기(≈300ms)를
  // 없애 첫 탭이 바로 먹히게 한다.
  const controlClassName = "min-h-11 flex-1 touch-manipulation sm:min-h-0";

  return (
    <Panel className="flex w-full flex-col gap-3.25 px-5 py-4.5">
      <div className="flex items-center justify-between">
        <span className="font-display text-[18px] text-ink">집중 타이머</span>
        <span className="text-[12px] font-semibold text-ink-soft">
          {session.missionTitle ? `${session.missionTitle} · ` : ""}
          {STATUS_LABEL[status]}
        </span>
      </div>

      <TimerDisplay seconds={displaySeconds} />

      {session.deadlineLabel ? (
        <div className="text-right text-[11.5px] font-semibold text-ink-soft">
          마감까지 {session.deadlineLabel}
        </div>
      ) : null}

      <div className="flex gap-2">
        {status === "running" ? (
          <>
            <Button variant="outline" size="sm" className={controlClassName} onClick={pause}>
              일시정지
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={controlClassName}
              onClick={stop}
              disabled={updateFocusSession.isPending}
            >
              중지
            </Button>
          </>
        ) : status === "paused" ? (
          <>
            <Button
              variant="solid"
              size="sm"
              className={controlClassName}
              onClick={resume}
              disabled={updateFocusSession.isPending}
            >
              재개
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={controlClassName}
              onClick={stop}
              disabled={updateFocusSession.isPending}
            >
              중지
            </Button>
          </>
        ) : (
          <Button
            variant="solid"
            size="sm"
            className={controlClassName}
            onClick={start}
            disabled={updateFocusSession.isPending}
          >
            집중 시작
          </Button>
        )}
      </div>
    </Panel>
  );
}
