/**
 * components/DashboardPages/DashboardProgressOverview.jsx
 */
import { Link } from "react-router-dom";
import { TrendingUp, ChevronRight } from "lucide-react";
import { SectionTitle, Card, ProgressBar } from "./DashboardUI";
import { mockEnrollments } from "../../mock/dashboard";

// ─── Course progress overview ────────────────────────────────────────────────

export function DashboardProgressOverview() {
  const active = mockEnrollments.filter((e) => e.status === "active");

  return (
    <div>
      <SectionTitle icon={TrendingUp} action={
        <Link to="/dashboard/course-progress" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
          Full analytics <ChevronRight className="w-3 h-3" />
        </Link>
      }>
        Course Progress
      </SectionTitle>

      <Card>
        <div className="divide-y divide-gray-800">
          {active.map((enr) => (
            <div key={enr._id}
              className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors"
            >
              <img
                src={enr.course.thumbnail?.secure_url}
                alt={enr.course.title}
                className="w-12 h-12 rounded-lg object-cover border border-gray-800"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium line-clamp-1">{enr.course.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {enr.completedLessons}/{enr.totalLessons} lessons
                </p>
                <ProgressBar value={enr.progressPercentage} className="mt-2" />
              </div>
              <div className="text-right shrink-0">
                <p className="text-white font-bold text-sm">{enr.progressPercentage}%</p>
                <p className="text-gray-600 text-xs">{enr.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
