import { cn } from "@/shared/lib/cn";

export function UserAvatar({ nickname, className }: { nickname: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8.5 items-center justify-center border-2 border-ink bg-transparent text-[11.5px] font-bold text-ink",
        className,
      )}
      title={nickname}
    >
      {nickname.slice(0, 2)}
    </div>
  );
}
