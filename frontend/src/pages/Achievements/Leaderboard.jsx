/**
 * pages/Achievements/Leaderboard.jsx
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpenCheck,
  CheckCircle2,
  Flame,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, StatCard, TabBar, fadeUp } from "../../components/DashboardPages/DashboardUI";
import LeaderboardFilters from "../../components/AchievementPages/LeaderboardFilters";
import LeaderboardTable from "../../components/AchievementPages/LeaderboardTable";
import {
  LEADERBOARD_TAB_CONFIG,
  LEADERBOARD_TYPES,
} from "../../constants/leaderboard.constants";
import {
  clearLeaderboardRefreshRequired,
  fetchLeaderboard,
  fetchLeaderboardCourses,
  setLeaderboardAssignmentCourseId,
  setLeaderboardCourseId,
  setLeaderboardPeriod,
  setLeaderboardType,
} from "../../redux/slices/leaderboard.slice.js";

export default function Leaderboard() {
  const dispatch = useDispatch();
  const {
    activeType,
    period,
    courseId,
    assignmentCourseId,
    entries,
    loading,
    courses,
    mySummary,
    needsRefresh,
  } = useSelector((state) => state.leaderboard);

  useEffect(() => {
    dispatch(fetchLeaderboardCourses());
  }, [dispatch]);

  useEffect(() => {
    if (activeType === LEADERBOARD_TYPES.COURSE && !courseId && courses.length) {
      dispatch(setLeaderboardCourseId(courses[0].value));
      return;
    }

    dispatch(fetchLeaderboard());
  }, [dispatch, activeType, period, courseId, assignmentCourseId, courses.length]);

  useEffect(() => {
    if (!needsRefresh) return;
    dispatch(fetchLeaderboard());
    dispatch(clearLeaderboardRefreshRequired());
  }, [dispatch, needsRefresh]);

  const tabLabels = LEADERBOARD_TAB_CONFIG.map((tab) => tab.label);
  const activeLabel = LEADERBOARD_TAB_CONFIG.find((tab) => tab.key === activeType)?.label || "Global";

  const handleTabChange = (label) => {
    const selected = LEADERBOARD_TAB_CONFIG.find((tab) => tab.label === label);
    if (!selected) return;
    dispatch(setLeaderboardType(selected.key));
  };

  const selectedCourseLabel = courses.find((item) => item.value === courseId)?.label;

  const cardsByType = {
    [LEADERBOARD_TYPES.GLOBAL]: [
      { icon: Trophy, label: "Your Rank", value: mySummary?.rank ? `#${mySummary.rank}` : "--", accent: true },
      { icon: Sparkles, label: "Total Points", value: (mySummary?.totalPoints || 0).toLocaleString() },
      { icon: BookOpenCheck, label: "Enrolled Courses", value: mySummary?.enrolledCourseCount || 0 },
      { icon: Flame, label: "Current Streak", value: `${mySummary?.currentStreak || 0}d` },
    ],
    [LEADERBOARD_TYPES.COURSE]: [
      { icon: Trophy, label: "Course Rank", value: mySummary?.rank ? `#${mySummary.rank}` : "--", accent: true },
      { icon: Sparkles, label: "Course Points", value: (mySummary?.pointsBreakdown?.coursePoints || 0).toLocaleString() },
      { icon: CheckCircle2, label: "Completed Courses", value: mySummary?.courseCompletedCount || 0 },
      { icon: Timer, label: "Study Hours", value: `${Number(mySummary?.studyHours || 0).toFixed(1)}h` },
    ],
    [LEADERBOARD_TYPES.ASSIGNMENT]: [
      { icon: Trophy, label: "Assignment Rank", value: mySummary?.rank ? `#${mySummary.rank}` : "--", accent: true },
      { icon: Sparkles, label: "Assignment Points", value: (mySummary?.pointsBreakdown?.assignmentPoints || 0).toLocaleString() },
      { icon: CheckCircle2, label: "Submitted", value: mySummary?.assignmentSubmittedCount || 0 },
      { icon: Flame, label: "90%+ Scores", value: mySummary?.assignment90PlusCount || 0 },
    ],
    [LEADERBOARD_TYPES.STREAK]: [
      { icon: Trophy, label: "Streak Rank", value: mySummary?.rank ? `#${mySummary.rank}` : "--", accent: true },
      { icon: Flame, label: "Streak Points", value: (mySummary?.pointsBreakdown?.streakPoints || 0).toLocaleString() },
      { icon: Sparkles, label: "Current Streak", value: `${mySummary?.currentStreak || 0}d` },
      { icon: BookOpenCheck, label: "Active Days", value: mySummary?.totalActiveDays || 0 },
    ],
  };

  const summaryCards = cardsByType[activeType] || cardsByType[LEADERBOARD_TYPES.GLOBAL];

  return (
    <UserLayout>
      <PageShell
        title="Leaderboard"
        subtitle={
          activeType === LEADERBOARD_TYPES.COURSE && selectedCourseLabel
            ? `Course leaderboard for ${selectedCourseLabel}`
            : "Compete with learners in real time across global, course, assignment, and streak boards."
        }
        actions={
          <TabBar tabs={tabLabels} active={activeLabel} onChange={handleTabChange} />
        }
      >
        {/* User's own stats */}
        <motion.div {...fadeUp(0)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </motion.div>

        <motion.div {...fadeUp(0.05)}>
          <LeaderboardFilters
            activeType={activeType}
            period={period}
            courseId={courseId}
            assignmentCourseId={assignmentCourseId}
            courseOptions={courses}
            onPeriodChange={(nextPeriod) => dispatch(setLeaderboardPeriod(nextPeriod))}
            onCourseChange={(nextCourseId) => dispatch(setLeaderboardCourseId(nextCourseId))}
            onAssignmentCourseChange={(nextCourseId) => dispatch(setLeaderboardAssignmentCourseId(nextCourseId))}
          />
        </motion.div>

        {loading ? (
          <div className="rounded-xl border border-gray-800 bg-[#111] p-8 text-center text-sm text-gray-500">
            Refreshing leaderboard...
          </div>
        ) : (
          <LeaderboardTable data={entries} activeType={activeType} />
        )}
      </PageShell>
    </UserLayout>
  );
}
