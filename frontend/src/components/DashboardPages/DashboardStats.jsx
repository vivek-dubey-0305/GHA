/**
 * components/DashboardPages/DashboardStats.jsx
 */
import { motion } from "framer-motion";
import { BookOpen, Clock, TrendingUp, FileText, Wallet, Award, Flame } from "lucide-react";
import { StatCard, fadeUp } from "./DashboardUI";
import { mockDashboardSummary } from "../../mock/dashboard";
import { formatCurrency, formatDuration } from "../../utils/format.utils";

const { stats } = mockDashboardSummary;

export default function DashboardStats() {
  const cards = [
    {
      icon: BookOpen,
      label: "Enrolled Courses",
      value: stats.enrolledCourses,
      subtitle: `${stats.completedCourses} completed`,
    },
    {
      icon: Clock,
      label: "Learning Hours",
      value: `${stats.learningHoursThisMonth}h`,
      subtitle: "This month",
    },
    {
      icon: TrendingUp,
      label: "Avg. Progress",
      value: "57%",
      subtitle: "Across active courses",
    },
    {
      icon: FileText,
      label: "Pending Assignments",
      value: stats.pendingAssignments,
      subtitle: "Action required",
    },
    {
      icon: Wallet,
      label: "Wallet Balance",
      value: formatCurrency(stats.walletBalance, "INR"),
      subtitle: "Prize & referral earnings",
      accent: true,
    },
    {
      icon: Award,
      label: "Certificates",
      value: stats.certificatesEarned,
      subtitle: "Earned so far",
    },
    {
      icon: Flame,
      label: "Learning Streak",
      value: `${stats.currentStreak}d`,
      subtitle: "Keep it going!",
      accent: true,
    },
    {
      icon: TrendingUp,
      label: "Leaderboard Rank",
      value: `#${stats.rank}`,
      subtitle: `${stats.totalPoints.toLocaleString()} points`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div key={card.label} {...fadeUp(i * 0.05)}>
          <StatCard {...card} />
        </motion.div>
      ))}
    </div>
  );
}
