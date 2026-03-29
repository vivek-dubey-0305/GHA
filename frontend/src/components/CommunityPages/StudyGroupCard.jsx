/**
 * components/CommunityPages/StudyGroupCard.jsx
 */
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { timeAgo } from "../../utils/format.utils";

export default function StudyGroupCard({ group, delay = 0, onJoin, onOpen }) {
  const memberCount = Number(group.memberCount ?? group.members ?? 0);
  const maxMembers = Number(group.maxMembers ?? 500);
  const spotsLeft = Math.max(0, maxMembers - memberCount);
  const courseTitle = group.course?.title || "Course";
  const avatar = group.avatar || group.name?.charAt(0)?.toUpperCase() || "G";
  const lastActivity = group.lastMessageAt || group.updatedAt || group.lastActivity;
  const isMember = group.isMember ?? true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors"
    >
      {/* Avatar + name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl shrink-0 border border-gray-700">
          {avatar}
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-sm leading-snug">{group.name}</h3>
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{courseTitle}</p>
        </div>
      </div>

      <p className="text-gray-500 text-xs mb-4 line-clamp-2">{group.description || "Collaborate, ask doubts, and share resources."}</p>

      {/* Tags */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {(group.tags || []).map((t) => (
          <span key={t} className="text-[10px] text-gray-600 bg-gray-800/80 px-2 py-0.5 rounded-full">#{t}</span>
        ))}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" /> {memberCount}/{maxMembers} members
        </span>
        <span>Active {timeAgo(lastActivity)}</span>
      </div>

      {/* Capacity bar */}
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-yellow-400/60 rounded-full"
          style={{ width: `${Math.min(100, (memberCount / maxMembers) * 100)}%` }}
        />
      </div>

      <button
        onClick={isMember ? onOpen : onJoin}
        className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors active:scale-95
          ${isMember
            ? "border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
            : spotsLeft === 0
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-yellow-400 text-black hover:bg-yellow-300"
          }`}
        disabled={spotsLeft === 0 && !isMember}
      >
        {isMember ? "Open Group" : spotsLeft === 0 ? "Full" : "Join Group"}
      </button>
    </motion.div>
  );
}
