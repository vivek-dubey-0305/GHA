/**
 * pages/Achievements/Badges.jsx
 */
import { Star } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, SectionTitle } from "../../components/DashboardPages/DashboardUI";
import BadgeCard from "../../components/AchievementPages/BadgeCard";
import { mockBadges } from "../../mock/dashboard";

export default function Badges() {
  const earned = mockBadges.filter((b) => b.earned);
  const locked = mockBadges.filter((b) => !b.earned);

  return (
    <UserLayout>
      <PageShell
        title="Badges"
        subtitle="Gamified achievements — keep learning to unlock more."
      >
        {earned.length > 0 && (
          <div>
            <SectionTitle icon={Star}>
              Earned ({earned.length})
            </SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {earned.map((b, i) => (
                <BadgeCard key={b._id} badge={b} delay={i * 0.07} />
              ))}
            </div>
          </div>
        )}

        {locked.length > 0 && (
          <div>
            <SectionTitle icon={Star}>Locked</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {locked.map((b, i) => (
                <BadgeCard key={b._id} badge={b} delay={i * 0.07} />
              ))}
            </div>
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
