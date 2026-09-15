"use client";

import { Button } from "@/shared/ui/Button";
import { signInWithOAuth } from "@/features/login-with-oauth/model/signIn";

export function OAuthButtons() {
  return (
    <div className="flex w-full flex-col gap-2.75">
      <Button variant="kakao" size="lg" className="w-full" onClick={() => signInWithOAuth("kakao")}>
        카카오로 계속하기
      </Button>
      <Button variant="google" size="lg" className="w-full" onClick={() => signInWithOAuth("google")}>
        Google로 계속하기
      </Button>
    </div>
  );
}
