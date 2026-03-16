/**
 * components/DashboardPages/DashboardRecentAnnouncements.jsx
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Megaphone, ChevronRight } from "lucide-react";
import { SectionTitle, Card, fadeUp } from "./DashboardUI";
import { mockDashboardSummary } from "../../mock/dashboard";
import { timeAgo } from "../../utils/format.utils";

const TYPE_COLORS = {
  new_lecture:  "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  live_class:   "bg-blue-400/10 text-blue-400 border-blue-400/20",
  deadline:     "bg-orange-400/10 text-orange-400 border-orange-400/20",
  update:       "bg-purple-400/10 text-purple-400 border-purple-400/20",
  assignment:   "bg-red-400/10 text-red-400 border-red-400/20",
  general:      "bg-gray-700/50 text-gray-400 border-gray-700",
};

const TYPE_LABELS = {
  new_lecture: "New Lecture", live_class: "Live Class", deadline: "Deadline",
  update: "Update", assignment: "Assignment", general: "General",
};

export default function DashboardRecentAnnouncements() {
  const announcements = mockDashboardSummary.recentAnnouncements;
  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return (
    <motion.div {...fadeUp(0.3)}>
      <SectionTitle icon={Megaphone} action={
        <Link to="/dashboard/announcements" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      }>
        Announcements
        {unreadCount > 0 && (
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-black text-xs font-bold">
            {unreadCount}
          </span>
        )}
      </SectionTitle>

      <Card>
        <div className="divide-y divide-gray-800">
          {announcements.map((ann, i) => (
            <motion.div key={ann._id} {...fadeUp(0.35 + i * 0.07)}
              className="flex items-start gap-4 p-4 hover:bg-white/2 transition-colors"
            >
              {/* Unread dot */}
              <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 flex-none"
                style={{ background: ann.isRead ? "transparent" : "#FFD700", border: ann.isRead ? "1px solid #374151" : "none" }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[ann.type] ?? TYPE_COLORS.general}`}>
                    {TYPE_LABELS[ann.type] ?? "General"}
                  </span>
                  {ann.priority === "high" && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">
                      Urgent
                    </span>
                  )}
                </div>
                <p className={`text-sm font-medium leading-snug ${ann.isRead ? "text-gray-300" : "text-white"}`}>
                  {ann.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ann.content}</p>
                <p className="text-xs text-gray-700 mt-1.5">
                  {ann.instructor.firstName} {ann.instructor.lastName} · {timeAgo(ann.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
