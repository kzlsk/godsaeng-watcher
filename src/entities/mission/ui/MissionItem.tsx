import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import type { Mission } from "@/entities/mission/model/types";
import { formatMissionDeadline } from "@/entities/mission/ui/formatMissionDeadline";

interface MissionItemProps {
  mission: Mission;
  onToggle: () => void;
  onStartFocus: () => void;
}

export function MissionItem({ mission, onToggle, onStartFocus }: MissionItemProps) {
  const { topic, todo, deadline, isImportant, isCompleted, actualFocusMinutes } = mission;
  const deadlineText = formatMissionDeadline(deadline);

  return (
    <div
      className={cn(
        "flex items-center gap-3.25 border-b-2 border-border-soft px-5 py-3.5 last:border-b-0",
        !isCompleted && isImportant && "border-l-[5px] border-l-red-shadow bg-red-tint pl-3.75",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={isCompleted ? "미션 완료 취소" : "미션 완료 처리"}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center border-2 text-[11px] font-bold",
          isCompleted ? "border-green bg-green text-paper-3" : "border-ink bg-transparent",
        )}
      >
        {isCompleted ? "✓" : ""}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <span
          className={cn(
            "truncate text-[14px] font-medium text-ink",
            isCompleted && "text-ink-soft line-through",
          )}
        >
          {todo}
        </span>
        <span className="truncate text-[12px] font-semibold text-ink-soft">
          {topic}
          {deadlineText ? ` · ${deadlineText}` : ""}
          {actualFocusMinutes ? ` · ${actualFocusMinutes}분` : ""}
        </span>
      </div>

      {isImportant ? <Badge variant="danger">중요</Badge> : null}

      {isCompleted ? (
        <Badge variant="success">완료</Badge>
      ) : (
        <Button variant="solid" size="sm" onClick={onStartFocus}>
          집중 시작
        </Button>
      )}
    </div>
  );
}
