"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { MOBILE_NAV_ITEMS } from "@/shared/config/nav";

export function MobileTabBar() {
  const [active, setActive] = useState<string>(MOBILE_NAV_ITEMS[0].id);

  return (
    <div className="flex w-full border-t-2 border-ink bg-paper-2 sm:hidden">
      {MOBILE_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setActive(item.id)}
          className={cn(
            "flex-1 py-3.5 text-[13px] font-bold",
            active === item.id ? "bg-ink text-paper-3" : "text-ink-soft",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
