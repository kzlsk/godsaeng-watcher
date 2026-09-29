"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { useNag } from "@/entities/nag/model/useNag";
import { PersonaTabs } from "@/entities/nag/ui/PersonaTabs";
import { useRegenerateNag } from "@/features/regenerate-nag/model/useRegenerateNag";
import { NagIntensitySlider } from "@/features/regenerate-nag/ui/NagIntensitySlider";
import { DEFAULT_NAG_INTENSITY } from "@/features/regenerate-nag/ui/describeIntensity";
import type { NagPersonaId } from "@/shared/config/personas";

export function NagBanner({ onPlanTomorrow }: { onPlanTomorrow: () => void }) {
  const { data: nag } = useNag();
  const regenerate = useRegenerateNag();
  // 강도는 nag_settings에 저장하지 않는 화면 상태라, 새로고침하면 기본값으로 돌아간다.
  const [intensity, setIntensity] = useState(DEFAULT_NAG_INTENSITY);
  const [isIntensityOpen, setIsIntensityOpen] = useState(false);
  // 탭 선택은 화면 안에서만 즉시 바뀌는 로컬 상태다. 서버 요청은 "한 번 더 때려줘"에서만 보낸다.
  // null이면 아직 사용자가 고르지 않은 것 → 서버가 알려준 페르소나를 그대로 쓴다.
  const [selectedPersonaId, setSelectedPersonaId] = useState<NagPersonaId | null>(null);

  if (!nag) {
    return <div className="h-39 w-full animate-pulse border-[3px] border-line bg-surface-muted" />;
  }

  const isSuccess = nag.mode === "success";
  const activePersonaId = selectedPersonaId ?? nag.activePersonaId;

  function handleSelectPersona(personaId: NagPersonaId) {
    // 이미 선택된 페르소나를 다시 누르면 강도 슬라이더만 열고 닫는다.
    if (personaId === activePersonaId) {
      setIsIntensityOpen((open) => !open);
      return;
    }
    // 다른 페르소나는 API 호출 없이 선택만 바꾸고, 강도를 바로 고를 수 있게 슬라이더를 연다.
    setSelectedPersonaId(personaId);
    setIsIntensityOpen(true);
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
          activeId={activePersonaId}
          onSelect={handleSelectPersona}
          tone={nag.mode}
        />
      </div>

      {isIntensityOpen ? (
        <NagIntensitySlider value={intensity} onChange={setIntensity} />
      ) : null}

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
            onClick={() => regenerate.mutate({ personaId: activePersonaId, intensity })}
            disabled={regenerate.isPending}
          >
            한 번 더 때려줘
          </Button>
        )}
      </div>
    </div>
  );
}
