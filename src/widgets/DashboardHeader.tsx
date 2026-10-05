"use client";

import type { ReactElement } from "react";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/ui/Logo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { GoogleSymbol, KakaoSymbol } from "@/shared/ui/BrandSymbol";
import { getAppToday } from "@/shared/lib/date/getAppToday";
import { useLogout } from "@/features/logout/model/useLogout";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// getAppToday()가 반환하는 "YYYY-MM-DD"(새벽 2시/KST 컷오프 기준 오늘)를 한국어 날짜로
// 포맷한다. 서버 실행 타임존에 따라 결과가 달라지는 Date의 로컬 getter(getMonth 등) 대신
// 문자열을 UTC 자정으로 해석해 UTC getter로 읽어서, 실행 환경(로컬/Vercel 등)과 무관하게
// 항상 같은 결과가 나오게 한다.
export function formatAppDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 ${WEEKDAYS[date.getUTCDay()]}`;
}

/*
 * 헤더 박스 공통 규격 — 뱃지/토글/버튼의 높이·테두리·글자가 제각각이던 걸 하나로 맞춘다.
 * - 높이: 36px. 고정 h-9가 아니라 min-h-9로 둔다. 닉네임이 길어 줄바꿈되면 칸이 늘어나야 하기 때문.
 * - 테두리: 전부 2px(border-2). 색만 역할에 따라 다르다(표시=line / 조작=ink·line-strong).
 * - 글자: 12px / font-bold, 가로 패딩: 12px(px-3)
 * - 아이콘만 있는 칸(로그아웃)은 정사각형(w-9)
 * ThemeToggle도 같은 36px이 되도록 shared/ui/ThemeToggle.tsx의 크기 클래스만 함께 맞췄다.
 */
const HEADER_BOX = "inline-flex min-h-9 items-center gap-2 border-2 px-3 text-[12px] font-bold";
const HEADER_BOX_SQUARE =
  "inline-flex min-h-9 w-9 shrink-0 items-center justify-center border-2 text-[12px] font-bold";

const PROVIDER_LABELS: Record<string, string> = {
  kakao: "카카오",
  google: "구글",
  email: "이메일",
};

// 브랜드 심볼은 노란색/흰색 바탕 위에 올려야 색이 제대로 읽히므로 작은 정사각 바탕을 깐다.
const MARK_SIZE = "size-3.5";

const PROVIDER_MARKS: Record<string, { Mark: () => ReactElement; background: string }> = {
  kakao: { Mark: () => <KakaoSymbol className={MARK_SIZE} />, background: "bg-yellow" },
  google: { Mark: () => <GoogleSymbol className={MARK_SIZE} />, background: "bg-white" },
};

// 알려진 프로바이더는 한국어로, 모르는 값은 원문 그대로 보여준다(틀린 라벨보다 낫다).
export function describeAuthProvider(provider: string | null | undefined): string | null {
  if (!provider) return null;
  return PROVIDER_LABELS[provider] ?? provider;
}

interface DashboardHeaderProps {
  currentStreak: number;
  nickname: string;
  /** 로그인에 쓴 OAuth 프로바이더. useUser()가 세션에서 읽어 내려준다. */
  provider: string | null;
}

export function DashboardHeader({
  currentStreak,
  nickname,
  provider,
}: DashboardHeaderProps) {
  const logout = useLogout();
  const providerLabel = describeAuthProvider(provider);
  const providerMark = provider ? PROVIDER_MARKS[provider] : undefined;
  const accountTitle = providerLabel ? `${providerLabel} 계정 · ${nickname}` : nickname;

  function handleLogout() {
    logout.mutate(undefined, {
      onError: () => window.alert("로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요."),
    });
  }

  /*
   * 한 줄에 로고 + 칩 + 토글 + 버튼을 모두 넣으면 폭이 모자라 글자가 세로로 쪼개진다.
   * (375px뿐 아니라 640~768px에서도 로고 "갓생 감시자"가 2줄로 접히던 문제)
   * 그래서 한 줄 배치는 lg(1024px) 이상에서만 쓰고, 그 아래는 두 줄로 쌓는다.
   * 2행은 flex-wrap이라 닉네임이 길면 가로로 넘치는 대신 한 줄 더 내려간다.
   */
  return (
    <div className="flex w-full flex-col gap-2 border-b-2 border-line bg-paper-2 px-4 py-3 sm:px-6.5 sm:py-4.25 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
      <div className="flex w-full items-center justify-between gap-2 sm:gap-3 lg:w-auto lg:justify-start">
        {/* 로고는 어떤 폭에서도 줄바꿈되면 안 된다. */}
        <Logo size="sm" className="shrink-0 whitespace-nowrap" />
        <span className="whitespace-nowrap text-[11px] font-semibold text-ink-soft sm:text-[12.5px]">
          {formatAppDate(getAppToday())}
        </span>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:gap-3 lg:w-auto lg:flex-nowrap lg:justify-end">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          {/*
            닉네임 칩 — 프로바이더 로고를 따로 두지 않고 이 칩 안에 넣는다.
            박스가 하나 줄어 모바일 가로 공간이 생기고, "닉네임 옆에 로고"라는 요구에도 맞는다.
            닉네임은 자르지 않는다. 아주 긴 닉네임이면 칩 안에서 줄바꿈되고 칩 높이가 늘어난다.
          */}
          <span
            className={cn(HEADER_BOX, "min-w-0 border-line text-ink break-all lg:break-normal")}
            title={accountTitle}
          >
            {providerMark ? (
              <span
                role="img"
                aria-label={`${providerLabel} 계정으로 로그인했습니다.`}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center",
                  providerMark.background,
                )}
              >
                <providerMark.Mark />
              </span>
            ) : providerLabel ? (
              <span className="shrink-0 text-[10px] font-semibold text-ink-soft">
                {providerLabel}
              </span>
            ) : null}
            {nickname}
          </span>

          <span
            className={cn(HEADER_BOX, "shrink-0 whitespace-nowrap border-green-light text-green-light")}
          >
            연속 {currentStreak}일
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            aria-label={logout.isPending ? "로그아웃 중" : "로그아웃"}
            className={cn(
              HEADER_BOX_SQUARE,
              "border-ink bg-ink text-paper-3 transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50",
              // sm 이상에서는 라벨까지 보이므로 정사각형을 풀고 가로 패딩을 준다.
              "sm:w-auto sm:gap-1.5 sm:px-3",
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="size-3.5 shrink-0" aria-hidden="true">
              <path d="M14 4h6v16h-6M10 8l-4 4 4 4M6 12h10" strokeLinecap="square" />
            </svg>
            {/* 모바일에서는 아이콘만 남기고 라벨은 숨긴다(aria-label로 의미 유지). */}
            <span className="hidden whitespace-nowrap sm:inline">
              {logout.isPending ? "로그아웃 중…" : "로그아웃"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
