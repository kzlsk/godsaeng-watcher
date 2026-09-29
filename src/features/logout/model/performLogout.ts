interface LogoutDeps {
  signOut: () => Promise<{ error: unknown }>;
  clearCache: () => void;
  redirectToLogin: () => void;
}

// 세션 종료 → 캐시 비우기 → 로그인 페이지 이동 순서를 강제한다.
// signOut이 실패하면 세션이 아직 살아 있으므로 캐시도 그대로 두고 이동하지 않는다.
export async function performLogout({ signOut, clearCache, redirectToLogin }: LogoutDeps) {
  const { error } = await signOut();
  if (error) throw new Error("로그아웃에 실패했습니다.");

  // 다음에 다른 계정으로 로그인했을 때 이전 유저 데이터가 잠깐이라도 보이지 않도록 전부 비운다.
  clearCache();
  redirectToLogin();
}
