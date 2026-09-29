"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/shared/lib/supabase/client";
import { performLogout } from "@/features/logout/model/performLogout";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      performLogout({
        signOut: () => createClient().auth.signOut(),
        clearCache: () => queryClient.clear(),
        // router.replace 대신 전체 페이지 이동을 쓴다. Next 클라이언트 라우터 캐시와
        // useUser 등 메모리에 남은 이전 유저 상태까지 확실히 초기화하기 위해서다.
        // replace라서 뒤로가기로 대시보드에 돌아오지도 않는다.
        redirectToLogin: () => window.location.replace("/login"),
      }),
  });
}
