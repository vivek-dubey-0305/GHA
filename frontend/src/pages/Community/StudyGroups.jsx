/**
 * pages/Community/StudyGroups.jsx
 */
import { Users } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState, SectionTitle } from "../../components/DashboardPages/DashboardUI";
import StudyGroupCard from "../../components/CommunityPages/StudyGroupCard";
import { mockStudyGroups } from "../../mock/dashboard";

export default function StudyGroups() {
  const joined = mockStudyGroups.filter((g) => g.isMember);
  const discover = mockStudyGroups.filter((g) => !g.isMember);

  return (
    <UserLayout>
      <PageShell
        title="Study Groups"
        subtitle="Collaborate with peers — solve problems, share notes, grow together."
      >
        {joined.length > 0 && (
          <div>
            <SectionTitle icon={Users}>Your Groups</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {joined.map((g, i) => (
                <StudyGroupCard key={g._id} group={g} delay={i * 0.05} onJoin={() => {}} onOpen={() => {}} />
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionTitle icon={Users}>Discover Groups</SectionTitle>
          {discover.length === 0 ? (
            <EmptyState icon={Users} title="No groups to discover" subtitle="You've joined all available groups!" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {discover.map((g, i) => (
                <StudyGroupCard key={g._id} group={g} delay={i * 0.05} onJoin={() => {}} onOpen={() => {}} />
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </UserLayout>
  );
}
