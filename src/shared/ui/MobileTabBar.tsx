"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import {
  MOBILE_NAV_ITEMS,
  computeNavScrollTop,
  resolveActiveNavId,
  type MobileNavItem,
} from "@/shared/config/nav";

/*
 * 탭을 눌러 부드럽게 스크롤하는 동안에는 중간 섹션들을 지나가므로, 그때마다 활성 탭이
 * 깜빡이며 바뀐다. 그래서 누른 직후 이 시간 동안은 스크롤 감지를 쉬게 둔다.
 * (스크롤이 끝나면 어차피 누른 탭이 활성으로 잡힌다)
 */
const SPY_PAUSE_MS = 700;

function readSectionPositions() {
  return MOBILE_NAV_ITEMS.flatMap((item) => {
    const element = document.getElementById(item.sectionId);
    if (!element) return [];
    return [{ id: item.id, top: element.getBoundingClientRect().top + window.scrollY }];
  });
}

export function MobileTabBar() {
  const [active, setActive] = useState<string>(MOBILE_NAV_ITEMS[0].id);
  // 탭을 눌러 이동하는 동안 스크롤 감지를 쉬게 하는 플래그와 그 해제 타이머
  const isPausedRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 스크롤 위치에 따라 활성 탭을 따라가게 한다(스크롤 스파이).
  // 예: 타이머를 눌렀다가 그냥 위로 스크롤해 올라오면 다시 통계가 선택된다.
  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      if (isPausedRef.current) return;

      const scrollElement = document.documentElement;
      const isAtBottom =
        window.scrollY + window.innerHeight >= scrollElement.scrollHeight - 2;
      const nextId = resolveActiveNavId(readSectionPositions(), window.scrollY, isAtBottom);
      // 값이 같으면 React가 리렌더를 건너뛰므로 매 프레임 호출해도 괜찮다.
      if (nextId) setActive(nextId);
    }

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function handleSelect(item: MobileNavItem) {
    setActive(item.id);
    isPausedRef.current = true;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, SPY_PAUSE_MS);

    // 섹션 래퍼는 위젯이 로딩 중(스켈레톤)이어도 항상 그려지므로 보통 바로 찾힌다.
    const element = document.getElementById(item.sectionId);
    if (!element) return;

    window.scrollTo({
      top: computeNavScrollTop(element.getBoundingClientRect().top, window.scrollY),
      behavior: "smooth",
    });
  }

  return (
    <nav
      aria-label="섹션 이동"
      className="flex w-full border-t-2 border-line bg-paper-2 sm:hidden"
    >
      {MOBILE_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handleSelect(item)}
          aria-current={active === item.id ? "true" : undefined}
          className={cn(
            "flex-1 py-3.5 text-[13px] font-bold",
            active === item.id ? "bg-ink text-paper-3" : "text-ink-soft",
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
