/**
 * pages/Assignments/Assignments.jsx
 */
import { useState } from "react";
import { FileText } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar, EmptyState } from "../../components/DashboardPages/DashboardUI";
import AssignmentCard from "../../components/AssignmentPages/AssignmentCard";
import AssignmentFeedback from "../../components/AssignmentPages/AssignmentFeedback";
import { mockAssignments, mockSubmissions } from "../../mock/dashboard";
import { ASSIGNMENT_TABS } from "../../constants/dashboard.constants";

export default function Assignments() {
  const [activeTab, setActiveTab] = useState("All");
  const [selected, setSelected] = useState(null);

  const submissionMap = Object.fromEntries(
    mockSubmissions.map((s) => [s.assignment._id, s])
  );

  const filtered = mockAssignments.filter((a) => {
    if (activeTab === "All") return true;
    if (activeTab === "Pending")   return a.status === "pending";
    if (activeTab === "Submitted") return a.status === "submitted";
    if (activeTab === "Graded")    return a.status === "graded";
    return true;
  });

  const selectedSubmission = selected ? submissionMap[selected._id] : null;

  return (
    <UserLayout>
      <PageShell
        title="Assignments"
        subtitle="Track your pending, submitted, and graded assignments."
      >
        <TabBar tabs={ASSIGNMENT_TABS} active={activeTab} onChange={setActiveTab} />

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No assignments here" subtitle="Check another tab." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((asgn, i) => (
              <AssignmentCard
                key={asgn._id}
                assignment={asgn}
                submission={submissionMap[asgn._id]}
                delay={i * 0.05}
                onOpen={() => asgn.status === "graded" && setSelected(asgn)}
              />
            ))}
          </div>
        )}
      </PageShell>

      {selected && (
        <AssignmentFeedback
          assignment={selected}
          submission={selectedSubmission}
          onClose={() => setSelected(null)}
        />
      )}
    </UserLayout>
  );
}
