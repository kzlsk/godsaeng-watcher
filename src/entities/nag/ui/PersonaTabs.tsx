import { cn } from "@/shared/lib/cn";
import type { NagPersonaScore } from "@/entities/nag/model/types";
import type { NagPersonaId } from "@/shared/config/personas";

interface PersonaTabsProps {
  personas: NagPersonaScore[];
  activeId: NagPersonaId;
  onSelect: (id: NagPersonaId) => void;
  tone: "success" | "fail";
}

export function PersonaTabs({ personas, activeId, onSelect, tone }: PersonaTabsProps) {
  // 모바일에서는 탭 4개가 3+1로 접혀 어색해서 2열 그리드(2x2)로 고정한다.
  // sm 이상은 기존 그대로 한 줄 flex 배치 — 동작/props는 건드리지 않고 배치 클래스만 바꾼다.
  return (
    <div className="grid w-full grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-4.5">
      {personas.map((persona) => {
        const isActive = persona.id === activeId;
        return (
          <button
            key={persona.id}
            type="button"
            onClick={() => onSelect(persona.id)}
            className={cn(
              "flex items-center justify-center gap-1.75 border-b-[3px] px-0.5 pb-2.25 pt-1.25 text-[13px] font-semibold text-paper-3 sm:justify-start",
              isActive ? "border-paper-3" : "border-transparent opacity-70",
            )}
          >
            {persona.name}
            {isActive ? (
              <span className={cn("text-[11.6px] font-extrabold", tone === "success" ? "text-paper-3" : "text-paper-3")}>
                {persona.score}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
