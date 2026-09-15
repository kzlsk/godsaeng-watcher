import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { AUTH_GUARD_ENABLED } from "@/shared/config/auth";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  if (AUTH_GUARD_ENABLED) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (!data?.claims) {
      redirect("/login");
    }
  }

  return children;
}
