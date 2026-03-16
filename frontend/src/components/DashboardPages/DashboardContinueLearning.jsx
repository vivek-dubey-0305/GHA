/**
 * components/DashboardPages/DashboardContinueLearning.jsx
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, BookOpen, ChevronRight } from "lucide-react";
import { SectionTitle, Card, ProgressBar, fadeUp } from "./DashboardUI";
import { mockDashboardSummary } from "../../mock/dashboard";
import { formatDuration, timeAgo } from "../../utils/format.utils";

export default function DashboardContinueLearning() {
  const items = mockDashboardSummary.continueLearning;

  return (
    <motion.div {...fadeUp(0.1)}>
      <SectionTitle icon={BookOpen} action={
        <Link to="/dashboard/courses" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      }>
        Continue Learning
      </SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(({ enrollment: enr, nextLesson }, i) => (
          <motion.div key={enr._id} {...fadeUp(0.15 + i * 0.08)}>
            <Card className="overflow-hidden group" hover>
              {/* Thumbnail */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={enr.course.thumbnail?.secure_url || `https://picsum.photos/seed/${enr._id}/400/200`}
                  alt={enr.course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                    <span>{enr.progressPercentage}%</span>
                    <span>{enr.completedLessons}/{enr.totalLessons} lessons</span>
                  </div>
                  <ProgressBar value={enr.progressPercentage} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-1">
                  {enr.course.title}
                </h3>
                <p className="text-gray-500 text-xs mb-3">
                  {enr.course.instructor.firstName} {enr.course.instructor.lastName}
                </p>

                {nextLesson && (
                  <div className="bg-black/40 border border-gray-800 rounded-lg p-2.5 mb-3">
                    <p className="text-gray-500 text-xs mb-0.5">Next up</p>
                    <p className="text-gray-200 text-xs line-clamp-1">{nextLesson.title}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{formatDuration(nextLesson.duration)}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-xs">
                    {enr.lastAccessedAt ? `Last: ${timeAgo(enr.lastAccessedAt)}` : ""}
                  </span>
                  <Link
                    to={`/dashboard/courses`}
                    className="flex items-center gap-1.5 bg-yellow-400 text-black text-xs font-semibold px-3 py-1.5 rounded-lg
                      hover:bg-yellow-300 transition-colors active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-black" />
                    Resume
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
