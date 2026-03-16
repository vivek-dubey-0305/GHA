/**
 * components/CommunicationPages/AnnouncementCard.jsx
 */
import { motion } from "framer-motion";
import { Megaphone, BookOpen, Video, Clock, RefreshCw, FileText } from "lucide-react";
import { Avatar, StatusBadge } from "../DashboardPages/DashboardUI";
import { timeAgo } from "../../utils/format.utils";

const TYPE_CONFIG = {
  new_lecture:  { icon: BookOpen,    label: "New Lecture",  style: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  live_class:   { icon: Video,       label: "Live Class",   style: "text-blue-400 bg-blue-400/10 border-blue-400/20"       },
  deadline:     { icon: Clock,       label: "Deadline",     style: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  update:       { icon: RefreshCw,   label: "Update",       style: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  assignment:   { icon: FileText,    label: "Assignment",   style: "text-red-400 bg-red-400/10 border-red-400/20"          },
  general:      { icon: Megaphone,   label: "General",      style: "text-gray-400 bg-gray-800 border-gray-700"             },
};

export default function AnnouncementCard({ announcement, delay = 0, onMarkRead }) {
  const { title, content, instructor, course, type, priority, isRead, createdAt } = announcement;
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;
  const TypeIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`bg-[#111] border rounded-xl p-5 transition-colors
        ${!isRead ? "border-yellow-400/15 hover:border-yellow-400/30" : "border-gray-800 hover:border-gray-700"}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge label={cfg.label} className={cfg.style} />
          {priority === "high" && (
            <StatusBadge label="Urgent" className="text-red-400 bg-red-400/10 border-red-400/20" />
          )}
        </div>
        {!isRead && (
          <button
            onClick={() => onMarkRead?.(announcement._id)}
            className="text-[10px] text-gray-600 hover:text-yellow-400 transition-colors whitespace-nowrap shrink-0"
          >
            Mark read
          </button>
        )}
      </div>

      {/* Unread indicator */}
      <div className="flex gap-3">
        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isRead ? "bg-transparent border border-gray-800" : "bg-yellow-400"}`} />

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm leading-snug mb-1.5 ${isRead ? "text-gray-300" : "text-white"}`}>
            {title}
          </h3>
          <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed mb-4">{content}</p>

          {/* Instructor + course */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Avatar
                src={instructor?.profilePicture?.secure_url}
                name={`${instructor?.firstName} ${instructor?.lastName}`}
                size="sm"
              />
              <div>
                <p className="text-gray-400 text-xs font-medium">
                  {instructor?.firstName} {instructor?.lastName}
                </p>
                {course && (
                  <p className="text-gray-600 text-[10px]">{course?.title}</p>
                )}
              </div>
            </div>
            <span className="text-gray-700 text-xs">{timeAgo(createdAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
