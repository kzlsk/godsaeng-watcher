"use client";

import { useState } from "react";
import { useUser } from "@/entities/user/model/useUser";
import { useStreak } from "@/entities/streak/model/useStreak";
import { DashboardHeader } from "@/widgets/DashboardHeader";
import { NagBanner } from "@/widgets/NagBanner";
import { MissionBoard } from "@/widgets/MissionBoard";
import { DailyStatsPanel } from "@/widgets/DailyStatsPanel";
import { FocusTimerPanel } from "@/widgets/FocusTimerPanel";
import { StreakBar } from "@/widgets/StreakBar";
import { AddMissionModal } from "@/features/add-mission/ui/AddMissionModal";
import { MobileTabBar } from "@/shared/ui/MobileTabBar";
import { NAV_SECTION_IDS } from "@/shared/config/nav";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: streak } = useStreak();
  const [isAddMissionOpen, setIsAddMissionOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full justify-center bg-surface pb-16 sm:p-10 sm:pb-10">
      <div className="w-full border-line bg-paper-2 sm:max-w-260 sm:border-2 sm:p-0.5 sm:shadow-brut">
        <div className="flex w-full flex-col bg-surface">
          <DashboardHeader
            currentStreak={streak?.currentStreak ?? 0}
            nickname={user?.nickname ?? "게스트"}
            provider={user?.provider ?? null}
          />

          <div className="flex flex-col gap-4.5 p-4 sm:gap-6 sm:p-6.5">
            <NagBanner onPlanTomorrow={() => setIsAddMissionOpen(true)} />

            {/*
              모바일 순서: 통계 → 스트릭 → 타이머 → 미션 / 데스크톱(lg): 좌 [통계·미션] 우 [타이머·스트릭].
              lg 미만에서는 두 열 래퍼를 display:contents로 없애 4개가 바깥 flex의 직접 자식이 되게 하고
              order로 순서를 잡는다. 이러면 같은 위젯을 두 번 렌더링하지 않고도 순서만 달라진다.
              lg에서는 래퍼가 다시 flex 열이 되므로 기존 데스크톱 배치가 그대로 유지된다.
            */}
            <div className="flex flex-col gap-4.5 lg:grid lg:grid-cols-[1.8fr_1fr] lg:gap-4.5">
              <div className="contents lg:flex lg:flex-col lg:gap-4.5">
                <section id={NAV_SECTION_IDS.stats} className="order-1 lg:order-none">
                  <DailyStatsPanel />
                </section>
                <section id={NAV_SECTION_IDS.missions} className="order-4 lg:order-none">
                  <MissionBoard
                    onOpenAddMission={() => setIsAddMissionOpen(true)}
                  />
                </section>
              </div>

              <div className="contents lg:flex lg:flex-col lg:gap-4.5">
                {/* id는 모바일 하단 탭(MobileTabBar)이 스크롤해 갈 앵커다. @/shared/config/nav 참고 */}
                <section id={NAV_SECTION_IDS.timer} className="order-3 lg:order-none">
                  <FocusTimerPanel />
                </section>
                <div className="order-2 lg:order-none">
                  <StreakBar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
        <MobileTabBar />
      </div>

      <AddMissionModal
        open={isAddMissionOpen}
        onClose={() => setIsAddMissionOpen(false)}
      />
    </div>
  );
}
