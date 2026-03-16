/**
 * components/AchievementPages/LeaderboardTable.jsx
 */
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Avatar } from "../DashboardPages/DashboardUI";

const RANK_STYLES = {
  1: { bg: "bg-yellow-400/10 border-yellow-400/30", text: "text-yellow-400", trophy: "🥇" },
  2: { bg: "bg-gray-400/5 border-gray-400/20",      text: "text-gray-300",   trophy: "🥈" },
  3: { bg: "bg-orange-400/5 border-orange-400/20",  text: "text-orange-400", trophy: "🥉" },
};

export default function LeaderboardTable({ data }) {
  return (
    <div className="space-y-2">
      {data.map((entry, i) => {
        const style = RANK_STYLES[entry.rank];
        const isUser = entry.isCurrentUser;

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
                <span className="text-xl">{RANK_STYLES[entry.rank]?.trophy}</span>
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
              <p className="text-gray-600 text-xs">
                {entry.badges} badges · {entry.coursesCompleted} courses
              </p>
            </div>

            {/* Stats */}
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${isUser ? "text-yellow-400" : style?.text ?? "text-gray-300"}`}>
                {entry.points.toLocaleString()}
              </p>
              <p className="text-gray-600 text-xs">{entry.studyHours}h studied</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
