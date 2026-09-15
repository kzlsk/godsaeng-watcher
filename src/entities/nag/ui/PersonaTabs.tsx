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
  return (
    <div className="flex flex-wrap items-center gap-4.5">
      {personas.map((persona) => {
        const isActive = persona.id === activeId;
        return (
          <button
            key={persona.id}
            type="button"
            onClick={() => onSelect(persona.id)}
            className={cn(
              "flex items-center gap-1.75 border-b-[3px] px-0.5 pb-2.25 pt-1.25 text-[13px] font-semibold text-paper-3",
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
