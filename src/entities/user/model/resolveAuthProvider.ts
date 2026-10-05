// Supabase 세션에서 로그인 프로바이더만 뽑아내기 위한 최소 구조.
// supabase-js의 User를 그대로 넘길 수 있다.
export interface AuthProviderSource {
  app_metadata?: { provider?: unknown } | null;
  identities?: ReadonlyArray<{ provider?: unknown }> | null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

// 소셜 로그인 프로바이더는 app_metadata.provider에 들어온다. 계정 연동 등으로 비어 있는 경우를
// 대비해 identities[].provider를 차선으로 읽는다.
export function resolveAuthProvider(
  user: AuthProviderSource | null | undefined,
): string | null {
  const fromAppMetadata = nonEmptyString(user?.app_metadata?.provider);
  if (fromAppMetadata) return fromAppMetadata;

  for (const identity of user?.identities ?? []) {
    const provider = nonEmptyString(identity?.provider);
    if (provider) return provider;
  }
  return null;
}
