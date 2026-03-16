/**
 * pages/Community/Discussions.jsx
 */
import { useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState, SearchBar, YellowButton } from "../../components/DashboardPages/DashboardUI";
import { DiscussionCard } from "../../components/CommunityPages/DiscussionCard";
import DiscussionThread from "../../components/CommunityPages/DiscussionThread";
import { mockDiscussions } from "../../mock/dashboard";
import { useSearch } from "../../hooks/useDashboard";

export default function Discussions() {
  const [selected, setSelected] = useState(null);
  const { query, setQuery, filtered } = useSearch(mockDiscussions, ["title", "content"]);

  return (
    <UserLayout>
      <PageShell
        title="Discussions & Q&A"
        subtitle="Ask questions, get answers from instructors and peers."
        actions={
          <YellowButton className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Discussion
          </YellowButton>
        }
      >
        <SearchBar value={query} onChange={setQuery} placeholder="Search discussions…" />

        {filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No discussions found" subtitle="Be the first to start a conversation!" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((disc, i) => (
              <DiscussionCard
                key={disc._id}
                discussion={disc}
                delay={i * 0.05}
                onClick={() => setSelected(disc)}
              />
            ))}
          </div>
        )}
      </PageShell>

      <DiscussionThread discussion={selected} onClose={() => setSelected(null)} />
    </UserLayout>
  );
}
