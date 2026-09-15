import { Logo } from "@/shared/ui/Logo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { OAuthButtons } from "@/features/login-with-oauth/ui/OAuthButtons";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface p-4 sm:p-10">
      <div className="w-full max-w-244 border-2 border-ink bg-paper-2 p-0.5 shadow-brut-sm">
        <div className="grid w-full grid-cols-1 bg-surface sm:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col justify-between gap-9 border-b-2 border-ink bg-red p-8 sm:border-b-0 sm:border-r-2 sm:p-11">
            <Logo tone="paper" />

            <h1 className="font-display text-[32px] leading-[1.25] text-paper-3 sm:text-[46px] sm:leading-[1.25]">
              오늘도 미루면
              <br />
              내일의 내가 운다
            </h1>

            <div className="flex flex-col gap-1.25">
              <span className="text-[12px] font-bold tracking-[0.72px] text-paper-3">
                할 일 · 마감 · 실제 실행 데이터
              </span>
              <p className="text-[12.7px] font-semibold leading-[1.6] text-paper-3">
                기록을 근거로 AI가 쓴소리를 던집니다.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-5.5 p-8 sm:p-10">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-[24px] text-ink">시작하기</h2>
              <p className="text-[12.5px] font-semibold text-ink-soft">
                계정 하나로 오늘의 미션이 이어집니다.
              </p>
            </div>

            <OAuthButtons />

            <p className="text-[10.5px] font-semibold leading-[1.75] text-ink-soft">
              로그인하면 서비스 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.
            </p>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
