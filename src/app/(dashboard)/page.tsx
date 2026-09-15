"use client";

import { useState } from "react";
import { useUser } from "@/entities/user/model/useUser";
import { useStreak } from "@/entities/streak/model/useStreak";
import { DashboardHeader } from "@/widgets/DashboardHeader";
import { NagBanner } from "@/widgets/NagBanner";
import { MissionBoard } from "@/widgets/MissionBoard";
import { FocusTimerPanel } from "@/widgets/FocusTimerPanel";
import { StreakBar } from "@/widgets/StreakBar";
import { AddMissionModal } from "@/features/add-mission/ui/AddMissionModal";
import { MobileTabBar } from "@/shared/ui/MobileTabBar";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: streak } = useStreak();
  const [isAddMissionOpen, setIsAddMissionOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full justify-center bg-surface pb-16 sm:p-10 sm:pb-10">
      <div className="w-full border-ink bg-paper-2 sm:max-w-260 sm:border-2 sm:p-0.5 sm:shadow-brut">
        <div className="flex w-full flex-col bg-surface">
          <DashboardHeader
            currentStreak={streak?.currentStreak ?? 0}
            nickname={user?.nickname ?? "게스트"}
          />

          <div className="flex flex-col gap-4.5 p-4 sm:gap-6 sm:p-6.5">
            <NagBanner onPlanTomorrow={() => setIsAddMissionOpen(true)} />

            <div className="grid grid-cols-1 gap-4.5 lg:grid-cols-[1.8fr_1fr]">
              <MissionBoard
                onOpenAddMission={() => setIsAddMissionOpen(true)}
              />

              <div className="flex flex-col gap-4.5">
                <FocusTimerPanel />
                <StreakBar />
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
