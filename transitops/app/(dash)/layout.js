import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLicenseAlerts } from "@/lib/analytics";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import HealthPill from "@/components/HealthPill";

export const dynamic = "force-dynamic";

export default async function DashLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const alerts = getLicenseAlerts();
  return (
    <div className="relative z-10 w-full max-w-[1600px] mx-auto px-8 py-6 flex gap-7">
      <Sidebar role={session.role} />
      <main className="flex-1 min-w-0">
        <Topbar session={session} alerts={alerts} healthPill={<HealthPill />} />
        {children}
      </main>
    </div>
  );
}
