/**
 * components/DashboardPages/DashboardStats.jsx
 */
import { BookOpen, Clock, TrendingUp, FileText, Wallet, Award, Flame, Clock as ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StatCard } from "./DashboardUI";
import { mockDashboardSummary } from "../../mock/dashboard";
import { formatCurrency } from "../../utils/format.utils";
import { fetchLeaderboardSummary } from "../../redux/slices/leaderboard.slice";
import { fetchMyStreak } from "../../redux/slices/streak.slice";
import { apiClient } from "../../utils/api.utils";

const { stats } = mockDashboardSummary;

export default function DashboardStats() {
  const dispatch = useDispatch();
  const summary = useSelector((state) => state.leaderboard.mySummary);
  const streak = useSelector((state) => state.streak.summary);
  
  const [submissionData, setSubmissionData] = useState({
    pendingAssignments: 0,
    submittedAssignments: 0,
    avgAssignmentScore: 0,
    totalAssignments: 0,
  });
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  useEffect(() => {
    dispatch(fetchLeaderboardSummary());
    dispatch(fetchMyStreak());
  }, [dispatch]);

  // Fetch assignment submission data
  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        setLoadingSubmissions(true);
        const response = await apiClient.get("/submissions/my?limit=100");
        const submissions = response?.data?.data?.submissions || [];

        // Calculate pending, submitted, and average score
        const pending = submissions.filter(s => s?.status === "submitted").length;
        const submitted = submissions.filter(s => s?.status !== "draft").length;
        const graded = submissions.filter(s => s?.status === "graded" && Number.isFinite(s?.score));

        const avgScore = graded.length
          ? Math.round(
              graded.reduce((sum, s) => sum + ((Number(s.score || 0) / Number(s.maxScore || 100)) * 100), 0) /
                graded.length
            )
          : 0;

        setSubmissionData({
          pendingAssignments: pending,
          submittedAssignments: submitted,
          avgAssignmentScore: avgScore,
          totalAssignments: submitted,
        });
      } catch (error) {
        console.error("Failed to fetch submission data:", error);
        setSubmissionData({
          pendingAssignments: 0,
          submittedAssignments: 0,
          avgAssignmentScore: 0,
          totalAssignments: 0,
        });
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissionData();
  }, []);

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
      value: submissionData.pendingAssignments,
      subtitle: loadingSubmissions ? "Loading..." : "Action required",
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
      label: "Avg Assignment Score",
      value: `${submissionData.avgAssignmentScore}%`,
      subtitle: loadingSubmissions ? "Loading..." : "From graded submissions",
    },
    {
      icon: Flame,
      label: "Learning Streak",
      value: `${streak?.currentStreak || 0}d`,
      subtitle: "Keep it going!",
      accent: true,
    },
    {
      icon: TrendingUp,
      label: "Leaderboard Rank",
      value: summary?.rank ? `#${summary.rank}` : "--",
      subtitle: `${(summary?.totalPoints || 0).toLocaleString()} points`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label}>
          <StatCard {...card} />
        </div>
      ))}
    </div>
  );
}
