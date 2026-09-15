import { cn } from "@/shared/lib/cn";

export function StreakDots({ days }: { days: boolean[] }) {
  return (
    <div className="flex w-full items-center gap-1">
      {days.map((completed, index) => {
        const isToday = index === days.length - 1;
        return (
          <div
            key={index}
            className={cn(
              "h-5 flex-1",
              isToday
                ? "border-2 border-dashed border-green-deep"
                : completed
                  ? "bg-green-deep"
                  : "bg-border-soft-2",
            )}
          />
        );
      })}
    </div>
  );
}
