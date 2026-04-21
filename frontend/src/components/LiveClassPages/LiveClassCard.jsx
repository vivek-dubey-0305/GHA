/**
 * components/LiveClassPages/LiveClassCard.jsx
 */
import { motion } from "framer-motion";
import { Video, Clock, Users, Play } from "lucide-react";
import { Avatar, StatusBadge } from "../DashboardPages/DashboardUI";
import { formatDate, formatDuration, timeFromNow } from "../../utils/format.utils";

const STATUS_STYLES = {
  scheduled: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  live:      "text-red-400 bg-red-400/10 border-red-400/20",
  completed: "text-green-400 bg-green-400/10 border-green-400/20",
};

export default function LiveClassCard({ liveClass, delay = 0, onJoin, onWatch, onSetReminder }) {
  const { title, instructor, course, sessionType, scheduledAt, duration, status,
          actualParticipants, maxParticipants, recordingAvailable } = liveClass;
  const instructorName = [instructor?.firstName, instructor?.lastName].filter(Boolean).join(" ").trim() || "Instructor";
  const instructorAvatar = instructor?.profilePicture?.secure_url || instructor?.avatar?.secure_url || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors"
    >
      {/* Status row */}
      <div className="flex items-center justify-between mb-3">
        <StatusBadge label={status === "live" ? "🔴 LIVE NOW" : status} className={STATUS_STYLES[status] ?? ""} />
        <span className="text-gray-600 text-xs capitalize">{sessionType}</span>
      </div>

      <h3 className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-2">{title}</h3>
      <p className="text-gray-500 text-xs mb-3 line-clamp-1">{course?.title ?? "General Session"}</p>

      {/* Instructor */}
      <div className="flex items-center gap-2 mb-4">
        <Avatar
          src={instructorAvatar}
          name={instructorName}
          size="sm"
        />
        <span className="text-gray-400 text-xs">
          {instructorName}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(duration)}
        </span>
        {status === "scheduled" && (
          <span className="text-yellow-400 font-medium">{timeFromNow(scheduledAt)}</span>
        )}
        {status === "completed" && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {actualParticipants}
          </span>
        )}
      </div>

      <p className="text-gray-700 text-xs mb-4">
        {formatDate(scheduledAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>

      {/* Action */}
      {status === "scheduled" && (
        <button
          onClick={onSetReminder}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-400 text-black
            font-semibold text-sm rounded-xl hover:bg-yellow-300 transition-colors active:scale-95"
        >
          <Video className="w-4 h-4" /> Set Reminder
        </button>
      )}
      {status === "live" && (
        <button
          onClick={onJoin}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white
            font-semibold text-sm rounded-xl hover:bg-red-400 transition-colors active:scale-95 animate-pulse"
        >
          <Video className="w-4 h-4" /> Join Now
        </button>
      )}
      {status === "completed" && recordingAvailable && (
        <button
          onClick={onWatch}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-700 text-gray-300
            font-medium text-sm rounded-xl hover:border-gray-500 hover:text-white transition-colors active:scale-95"
        >
          <Play className="w-4 h-4" /> Watch Recording
        </button>
      )}
      {status === "completed" && !recordingAvailable && (
        <div className="w-full py-2.5 text-center text-gray-600 text-xs border border-gray-800 rounded-xl">
          Recording not available
        </div>
      )}
    </motion.div>
  );
}
