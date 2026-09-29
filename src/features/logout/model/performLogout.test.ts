import { describe, expect, it, vi } from "vitest";
import { performLogout } from "./performLogout";

describe("performLogout", () => {
  it("signOut 성공 시 캐시를 비운 뒤 로그인 페이지로 이동한다", async () => {
    const calls: string[] = [];
    await performLogout({
      signOut: async () => {
        calls.push("signOut");
        return { error: null };
      },
      clearCache: () => calls.push("clearCache"),
      redirectToLogin: () => calls.push("redirect"),
    });

    expect(calls).toEqual(["signOut", "clearCache", "redirect"]);
  });

  it("signOut 실패 시 에러를 던지고 캐시 삭제/이동을 하지 않는다", async () => {
    const clearCache = vi.fn();
    const redirectToLogin = vi.fn();

    await expect(
      performLogout({
        signOut: async () => ({ error: new Error("network") }),
        clearCache,
        redirectToLogin,
      }),
    ).rejects.toThrow("로그아웃에 실패했습니다.");

    expect(clearCache).not.toHaveBeenCalled();
    expect(redirectToLogin).not.toHaveBeenCalled();
  });
});
