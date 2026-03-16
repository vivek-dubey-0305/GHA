/**
 * pages/Achievements/Leaderboard.jsx
 */
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, StatCard, fadeUp } from "../../components/DashboardPages/DashboardUI";
import LeaderboardTable from "../../components/AchievementPages/LeaderboardTable";
import { mockLeaderboard, mockDashboardSummary } from "../../mock/dashboard";

export default function Leaderboard() {
  const { stats } = mockDashboardSummary;

  return (
    <UserLayout>
      <PageShell
        title="Leaderboard"
        subtitle="Rankings based on study hours, quiz scores, and course completions."
      >
        {/* User's own stats */}
        <motion.div {...fadeUp(0)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Trophy, label: "Your Rank",       value: `#${stats.rank}`,                     accent: true },
            { icon: Trophy, label: "Total Points",    value: stats.totalPoints.toLocaleString()                 },
            { icon: Trophy, label: "Study Hours",     value: `${stats.learningHoursThisMonth}h`                },
            { icon: Trophy, label: "Courses Completed", value: mockDashboardSummary.stats.completedCourses     },
          ].map((c, i) => (
            <StatCard key={c.label} {...c} />
          ))}
        </motion.div>

        <LeaderboardTable data={mockLeaderboard} />
      </PageShell>
    </UserLayout>
  );
}
