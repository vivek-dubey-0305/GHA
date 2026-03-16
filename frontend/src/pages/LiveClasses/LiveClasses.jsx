/**
 * pages/LiveClasses/LiveClasses.jsx
 */
import { useState } from "react";
import { Video } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar, EmptyState } from "../../components/DashboardPages/DashboardUI";
import LiveClassCard from "../../components/LiveClassPages/LiveClassCard";
import { mockLiveClasses } from "../../mock/dashboard";
import { LIVE_CLASS_TABS } from "../../constants/dashboard.constants";

export default function LiveClasses() {
  const [activeTab, setActiveTab] = useState("Upcoming");

  const filtered = activeTab === "Upcoming"
    ? mockLiveClasses.filter((lc) => lc.status === "scheduled" || lc.status === "live")
    : mockLiveClasses.filter((lc) => lc.status === "completed");

  return (
    <UserLayout>
      <PageShell
        title="Live Classes"
        subtitle="Join upcoming sessions or re-watch past recordings."
      >
        <TabBar tabs={LIVE_CLASS_TABS} active={activeTab} onChange={setActiveTab} />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Video}
            title={activeTab === "Upcoming" ? "No upcoming classes" : "No recordings yet"}
            subtitle="Check back later or explore other courses."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((lc, i) => (
              <LiveClassCard
                key={lc._id}
                liveClass={lc}
                delay={i * 0.05}
                onJoin={() => {}}
                onWatch={() => {}}
              />
            ))}
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
