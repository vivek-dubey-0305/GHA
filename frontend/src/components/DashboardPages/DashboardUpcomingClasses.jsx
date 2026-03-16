/**
 * components/DashboardPages/DashboardUpcomingClasses.jsx
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Video, Clock, ChevronRight } from "lucide-react";
import { SectionTitle, Card, fadeUp } from "./DashboardUI";
import { mockDashboardSummary } from "../../mock/dashboard";
import { formatDate, timeFromNow, formatDuration } from "../../utils/format.utils";

export default function DashboardUpcomingClasses() {
  const classes = mockDashboardSummary.upcomingClasses;

  return (
    <motion.div {...fadeUp(0.2)}>
      <SectionTitle icon={Video} action={
        <Link to="/dashboard/live-classes" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      }>
        Upcoming Live Classes
      </SectionTitle>

      <Card>
        {classes.length === 0 ? (
          <p className="text-gray-600 text-sm p-6 text-center">No upcoming classes scheduled.</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {classes.map((lc, i) => (
              <motion.div key={lc._id} {...fadeUp(0.25 + i * 0.07)}
                className="flex items-start gap-4 p-4 hover:bg-white/2 transition-colors"
              >
                {/* Time badge */}
                <div className="flex-shrink-0 text-center bg-black border border-gray-800 rounded-xl px-3 py-2 min-w-[52px]">
                  <p className="text-yellow-400 text-xs font-bold">{timeFromNow(lc.scheduledAt)}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    {formatDate(lc.scheduledAt, { day: "numeric", month: "short" })}
                  </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm leading-snug line-clamp-1">{lc.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {lc.instructor.firstName} {lc.instructor.lastName} •{" "}
                    {lc.course?.title ?? "General Session"}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" /> {formatDuration(lc.duration)}
                    </span>
                    <span className="text-xs text-gray-700">•</span>
                    <span className="text-xs text-gray-600">{lc.sessionType}</span>
                  </div>
                </div>

                {/* Join */}
                <Link
                  to="/dashboard/live-classes"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-yellow-400/30 text-yellow-400
                    hover:bg-yellow-400/10 transition-colors shrink-0"
                >
                  Remind
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
