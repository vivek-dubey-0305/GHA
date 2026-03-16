/**
 * components/DashboardPages/DashboardProgressOverview.jsx
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, Flame, ChevronRight } from "lucide-react";
import { SectionTitle, Card, ProgressBar, fadeUp } from "./DashboardUI";
import { mockDashboardSummary, mockEnrollments } from "../../mock/dashboard";

// ─── Course progress overview ────────────────────────────────────────────────

export function DashboardProgressOverview() {
  const active = mockEnrollments.filter((e) => e.status === "active");

  return (
    <motion.div {...fadeUp(0.15)}>
      <SectionTitle icon={TrendingUp} action={
        <Link to="/dashboard/course-progress" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
          Full analytics <ChevronRight className="w-3 h-3" />
        </Link>
      }>
        Course Progress
      </SectionTitle>

      <Card>
        <div className="divide-y divide-gray-800">
          {active.map((enr, i) => (
            <motion.div key={enr._id} {...fadeUp(0.2 + i * 0.06)}
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
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Learning streak card ─────────────────────────────────────────────────────

export function DashboardStreakCard() {
  const { stats, streakData } = mockDashboardSummary;

  return (
    <motion.div {...fadeUp(0.25)}>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-white font-semibold">Learning Streak</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-400">{stats.currentStreak}</p>
            <p className="text-xs text-gray-500">days</p>
          </div>
        </div>

        {/* Week view */}
        <div className="flex items-end justify-between gap-1">
          {streakData.map(({ day, active }) => (
            <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-full h-8 rounded-md transition-colors
                  ${active ? "bg-orange-400/80" : "bg-gray-800"}`}
              />
              <span className="text-[10px] text-gray-600">{day}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-600 text-center mt-3">
          🔥 Keep your streak alive — study something today!
        </p>
      </Card>
    </motion.div>
  );
}
