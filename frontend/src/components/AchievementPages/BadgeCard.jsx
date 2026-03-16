/**
 * components/AchievementPages/BadgeCard.jsx
 */
import { motion } from "framer-motion";
import { formatDate } from "../../utils/format.utils";

export default function BadgeCard({ badge, delay = 0 }) {
  const { name, description, icon, color, earned, earnedAt, progress, total } = badge;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay }}
      className={`bg-[#111] border rounded-2xl p-5 flex flex-col items-center text-center transition-colors
        ${earned ? "border-yellow-400/20 hover:border-yellow-400/40" : "border-gray-800 hover:border-gray-700 opacity-60"}`}
    >
      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3
          ${earned ? "bg-yellow-400/10 border border-yellow-400/20" : "bg-gray-800 border border-gray-700"}`}
        style={earned ? { boxShadow: `0 0 20px ${color}22` } : {}}
      >
        {icon}
      </div>

      <h3 className={`font-bold text-sm mb-1 ${earned ? "text-white" : "text-gray-500"}`}>{name}</h3>
      <p className="text-gray-600 text-xs mb-3 leading-relaxed">{description}</p>

      {earned ? (
        <span className="text-xs text-yellow-400 font-medium">
          ✨ Earned {formatDate(earnedAt)}
        </span>
      ) : (
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-600 mb-1.5">
            <span>Progress</span>
            <span>{progress}/{total}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-600 rounded-full transition-all"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
