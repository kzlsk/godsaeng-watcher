export interface AppUser {
  id: string;
  nickname: string;
  email: string | null;
  /** 로그인에 쓴 OAuth 프로바이더("kakao" | "google" | "email" 등). 알 수 없으면 null. */
  provider: string | null;
}
