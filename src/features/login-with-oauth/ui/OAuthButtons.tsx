"use client";

import { Button } from "@/shared/ui/Button";
import { signInWithOAuth } from "@/features/login-with-oauth/model/signIn";

/**
 * 카카오 공식 심볼(말풍선). 버튼 배경이 항상 노란색이라 다크모드에서도
 * 색이 바뀌면 안 되므로 토큰 대신 브랜드 가이드의 #000000을 그대로 쓴다.
 */
function KakaoSymbol() {
  return (
    <svg
      viewBox="0 0 18 18"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#000000"
        d="M9 1C4.0294 1 0 4.1278 0 7.9846c0 2.4568 1.6368 4.6164 4.1058 5.8554-.1332.4572-.858 2.952-.8838 3.1482 0 0-.0174.1476.078.2034.0954.0558.2076.0126.2076.0126.2736-.0384 3.1716-2.0754 3.6732-2.4294C7.7406 14.9226 8.3628 14.9692 9 14.9692c4.9704 0 9-3.1278 9-6.9846C18 4.1278 13.9704 1 9 1z"
      />
    </svg>
  );
}

/** 구글 공식 "G" 로고. 브랜드 가이드상 색을 바꿀 수 없어 4색을 그대로 둔다. */
function GoogleSymbol() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function OAuthButtons() {
  return (
    <div className="flex w-full flex-col gap-2.75">
      <Button
        variant="kakao"
        size="lg"
        className="w-full"
        onClick={() => signInWithOAuth("kakao")}
      >
        <KakaoSymbol />
        Login with Kakao
      </Button>
      <Button
        variant="google"
        size="lg"
        className="w-full"
        onClick={() => signInWithOAuth("google")}
      >
        <GoogleSymbol />
        Sign in with Google
      </Button>
    </div>
  );
}
