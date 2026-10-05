"use client";

import { Button } from "@/shared/ui/Button";
import { GoogleSymbol, KakaoSymbol } from "@/shared/ui/BrandSymbol";
import { signInWithOAuth } from "@/features/login-with-oauth/model/signIn";

export function OAuthButtons() {
  return (
    <div className="flex w-full flex-col gap-2.75">
      <Button
        variant="kakao"
        size="lg"
        className="w-full"
        onClick={() => signInWithOAuth("kakao")}
      >
        <KakaoSymbol className="size-4.5" />
        Login with Kakao
      </Button>
      <Button
        variant="google"
        size="lg"
        className="w-full"
        onClick={() => signInWithOAuth("google")}
      >
        <GoogleSymbol className="size-4.5" />
        Sign in with Google
      </Button>
    </div>
  );
}
