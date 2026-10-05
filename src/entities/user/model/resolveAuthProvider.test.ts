import { describe, expect, it } from "vitest";
import { resolveAuthProvider } from "./resolveAuthProvider";

describe("resolveAuthProvider", () => {
  it("app_metadata.provider를 가장 먼저 쓴다", () => {
    expect(
      resolveAuthProvider({
        app_metadata: { provider: "kakao" },
        identities: [{ provider: "google" }],
      }),
    ).toBe("kakao");
  });

  it("app_metadata에 값이 없으면 identities의 첫 프로바이더를 쓴다", () => {
    expect(resolveAuthProvider({ app_metadata: {}, identities: [{ provider: "google" }] })).toBe(
      "google",
    );
  });

  it("빈 문자열/잘못된 타입은 값이 없는 것으로 본다", () => {
    expect(
      resolveAuthProvider({ app_metadata: { provider: "" }, identities: [{ provider: 7 }] }),
    ).toBeNull();
  });

  it("유저가 없거나 프로바이더 정보가 전혀 없으면 null이다", () => {
    expect(resolveAuthProvider(null)).toBeNull();
    expect(resolveAuthProvider(undefined)).toBeNull();
    expect(resolveAuthProvider({})).toBeNull();
    expect(resolveAuthProvider({ app_metadata: null, identities: null })).toBeNull();
  });
});
