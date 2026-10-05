"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // PC와 모바일을 번갈아 쓰는 사용이 기본이라, 창을 다시 포커스했을 때
            // 수동 새로고침 없이 최신 상태를 받아오게 한다.
            // refetchOnWindowFocus는 "stale한 쿼리만" 다시 받아오므로(query-core의
            // shouldFetchOn → isStale), staleTime이 포커스 동기화의 실질적인 하한이 된다.
            // 30초였을 때는 탭을 짧게 바꿨다 돌아오면 아무 일도 일어나지 않아서,
            // 폴링 주기(15~30초)보다 확실히 짧은 10초로 낮췄다.
            staleTime: 10_000,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
