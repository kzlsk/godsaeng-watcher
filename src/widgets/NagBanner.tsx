"use client";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { useNag } from "@/entities/nag/model/useNag";
import { PersonaTabs } from "@/entities/nag/ui/PersonaTabs";
import { useRegenerateNag } from "@/features/regenerate-nag/model/useRegenerateNag";
import type { NagPersonaId } from "@/shared/config/personas";

export function NagBanner({ onPlanTomorrow }: { onPlanTomorrow: () => void }) {
  const { data: nag } = useNag();
  const regenerate = useRegenerateNag();

  if (!nag) {
    return <div className="h-39 w-full animate-pulse border-[3px] border-ink bg-surface-muted" />;
  }

  const isSuccess = nag.mode === "success";

  function handleSelectPersona(personaId: NagPersonaId) {
    regenerate.mutate(personaId);
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6 border-[3px] p-5 sm:p-6",
        isSuccess ? "border-green-dark bg-green" : "border-red-shadow bg-red",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-paper-3/30 pb-4">
        <span className="text-[12px] font-bold tracking-[0.72px] text-paper-3">
          {isSuccess ? "AI 칭찬 · 오늘 전부 완료" : "AI 쓴소리"}
        </span>
        <PersonaTabs
          personas={nag.personas}
          activeId={nag.activePersonaId}
          onSelect={handleSelectPersona}
          tone={nag.mode}
        />
      </div>

      <div className="flex flex-col items-start justify-between gap-4.5 sm:flex-row sm:items-end">
        <p className="font-display text-[22px] leading-[1.35] text-paper-3 sm:text-[28px]">
          &ldquo;{nag.quote}&rdquo;
        </p>
        {isSuccess ? (
          <Button variant="cream" size="lg" onClick={onPlanTomorrow}>
            내일 미션 미리 짜기
          </Button>
        ) : (
          <Button
            variant="cream"
            size="lg"
            onClick={() => regenerate.mutate(undefined)}
            disabled={regenerate.isPending}
          >
            한 번 더 때려줘
          </Button>
        )}
      </div>
    </div>
  );
}
