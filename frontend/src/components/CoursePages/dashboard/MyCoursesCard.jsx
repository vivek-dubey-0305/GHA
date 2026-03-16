/**
 * components/CoursePages/dashboard/MyCoursesCard.jsx
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, Star, Clock } from "lucide-react";
import { ProgressBar, StatusBadge, Avatar } from "../../DashboardPages/DashboardUI";
import { formatDuration, timeAgo } from "../../../utils/format.utils";
import { LEVEL_COLORS } from "../../../constants/dashboard.constants";

export default function MyCoursesCard({ enrollment, delay = 0 }) {
  const { course, progressPercentage, completedLessons, totalLessons, lastAccessedAt, status } = enrollment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600
        transition-colors group flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={course.thumbnail?.secure_url || `https://picsum.photos/seed/${course._id}/400/200`}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[course.level]}`}>
            {course.level}
          </span>
        </div>
        {status === "completed" && (
          <div className="absolute top-3 right-3 bg-green-400/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-400/30">
            Completed
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white font-semibold text-sm leading-snug mb-1 line-clamp-2">
          {course.title}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <Avatar
            src={course.instructor?.profilePicture?.secure_url}
            name={`${course.instructor?.firstName} ${course.instructor?.lastName}`}
            size="sm"
          />
          <p className="text-gray-500 text-xs truncate">
            {course.instructor?.firstName} {course.instructor?.lastName}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-400 text-xs font-semibold">{course.rating}</span>
          <span className="text-gray-600 text-xs">({course.totalReviews})</span>
          <span className="text-gray-700 mx-1">·</span>
          <Clock className="w-3 h-3 text-gray-600" />
          <span className="text-gray-600 text-xs">{formatDuration(course.totalDuration)}</span>
        </div>

        {/* Progress */}
        <div className="mt-auto">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{completedLessons}/{totalLessons} lessons</span>
            <span>{progressPercentage}%</span>
          </div>
          <ProgressBar value={progressPercentage} />
          {lastAccessedAt && (
            <p className="text-xs text-gray-700 mt-1.5">Last: {timeAgo(lastAccessedAt)}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4">
          <Link
            to="/dashboard/courses"
            className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-400 text-black
              font-semibold text-sm rounded-xl hover:bg-yellow-300 transition-colors active:scale-95"
          >
            <Play className="w-3 h-3 fill-black" />
            {status === "completed" ? "Review" : "Resume"}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
