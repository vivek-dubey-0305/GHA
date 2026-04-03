/**
 * components/AchievementPages/LeaderboardTable.jsx
 */
import { motion } from "framer-motion";
import { Award, BookOpenCheck, Flame, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Avatar } from "../DashboardPages/DashboardUI";
import { LEADERBOARD_TYPES } from "../../constants/leaderboard.constants";

const RANK_STYLES = {
  1: { bg: "bg-yellow-400/10 border-yellow-400/30", text: "text-yellow-400", medal: "🥇" },
  2: { bg: "bg-gray-400/5 border-gray-400/20", text: "text-gray-300", medal: "🥈" },
  3: { bg: "bg-orange-400/5 border-orange-400/20", text: "text-orange-400", medal: "🥉" },
};

const getRankChangeMeta = (value = 0) => {
  if (value > 0) return { icon: TrendingUp, cls: "text-emerald-400", label: `+${value}` };
  if (value < 0) return { icon: TrendingDown, cls: "text-red-400", label: `${value}` };
  return { icon: Minus, cls: "text-gray-500", label: "0" };
};

const getProgressPercent = (entry, activeType) => {
  if (activeType === LEADERBOARD_TYPES.STREAK) {
    return Math.max(0, Math.min(100, Math.round(((entry.currentStreak || 0) / 60) * 100)));
  }

  return Math.max(0, Math.min(100, entry.xpPercent || 0));
};

const getPrimaryValue = (entry, activeType) => {
  if (activeType === LEADERBOARD_TYPES.STREAK) {
    return entry.pointsBreakdown?.streakPoints || entry.totalPoints || 0;
  }

  if (activeType === LEADERBOARD_TYPES.ASSIGNMENT) {
    return entry.pointsBreakdown?.assignmentPoints || 0;
  }

  if (activeType === LEADERBOARD_TYPES.COURSE) {
    return entry.pointsBreakdown?.coursePoints || 0;
  }

  return entry.totalPoints || 0;
};

const getSecondaryLabel = (entry, activeType) => {
  if (activeType === LEADERBOARD_TYPES.STREAK) {
    return `${entry.currentStreak || 0}d current`;
  }

  if (activeType === LEADERBOARD_TYPES.ASSIGNMENT) {
    return `${entry.assignmentSubmittedCount || 0} submissions`;
  }

  if (activeType === LEADERBOARD_TYPES.COURSE) {
    return `${entry.courseCompletedCount || 0} completed`;
  }

  return `Lv ${entry.level || 1} · ${(entry.studyHours || 0).toFixed(1)}h`;
};

export default function LeaderboardTable({ data, activeType = LEADERBOARD_TYPES.GLOBAL }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#111] p-8 text-center text-sm text-gray-500">
        No leaderboard entries available yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((entry, i) => {
        const style = RANK_STYLES[entry.rank];
        const isUser = entry.isCurrentUser;
        const rankChange = getRankChangeMeta(entry.rankChange);
        const RankChangeIcon = rankChange.icon;

        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-colors
              ${isUser
                ? "bg-yellow-400/5 border-yellow-400/20"
                : style ? `${style.bg}` : "bg-[#111] border-gray-800"
              }`}
          >
            {/* Rank */}
            <div className="w-8 text-center shrink-0">
              {entry.rank <= 3 ? (
                <span className="text-xl">{RANK_STYLES[entry.rank]?.medal}</span>
              ) : (
                <span className={`font-bold text-sm ${isUser ? "text-yellow-400" : "text-gray-600"}`}>
                  #{entry.rank}
                </span>
              )}
            </div>

            {/* Avatar + Name */}
            <Avatar src={entry.avatar} name={entry.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${isUser ? "text-yellow-400" : "text-white"}`}>
                {entry.name} {isUser && <span className="text-xs">(You)</span>}
              </p>
              {activeType === LEADERBOARD_TYPES.STREAK ? (
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-2 py-0.5 text-yellow-300">
                    <Flame className="w-3 h-3" /> {entry.currentStreak || 0}d
                  </span>
                  <span>{entry.longestStreak || 0}d best</span>
                  <span>{entry.totalActiveDays || 0} active days</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-1 rounded-full border border-gray-700 px-2 py-0.5">
                    <Award className="w-3 h-3" /> {entry.tier}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpenCheck className="w-3 h-3" /> {entry.enrolledCourseCount || 0} courses
                  </span>
                  <span>{entry.assignmentSubmittedCount || 0} assignments</span>
                </div>
              )}
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-yellow-400/80"
                  style={{ width: `${getProgressPercent(entry, activeType)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${isUser ? "text-yellow-400" : style?.text ?? "text-gray-300"}`}>
                {getPrimaryValue(entry, activeType).toLocaleString()}
              </p>
              <p className="text-gray-600 text-xs">{getSecondaryLabel(entry, activeType)}</p>
              <div className={`mt-1 inline-flex items-center gap-1 text-[11px] ${rankChange.cls}`}>
                <RankChangeIcon className="w-3 h-3" />
                <span>{rankChange.label}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
