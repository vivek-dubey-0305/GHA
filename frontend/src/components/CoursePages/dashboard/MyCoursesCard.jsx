/**
 * components/CoursePages/dashboard/MyCoursesCard.jsx
 */
import { Link } from "react-router-dom";
import { Play, Star, Clock } from "lucide-react";
import { ProgressBar, StatusBadge, Avatar } from "../../DashboardPages/DashboardUI";
import { formatDuration, timeAgo } from "../../../utils/format.utils";
import { LEVEL_COLORS } from "../../../constants/dashboard.constants";
import CourseRatingHover from "../../common/CourseRatingHover.jsx";

export default function MyCoursesCard({ enrollment, userReview = null }) {
  const { course = {}, progressPercentage = 0, completedLessons = 0, totalLessons = 0, lastAccessedAt, status } = enrollment;
  const instructorObj = typeof course.instructor === "object" ? course.instructor : null;
  const instructorName = instructorObj
    ? `${instructorObj.firstName || ""} ${instructorObj.lastName || ""}`.trim() || "Instructor"
    : "Instructor";
  const levelKey = String(course.level || "beginner").toLowerCase();
  const levelClasses = LEVEL_COLORS[levelKey] || "text-gray-300 bg-gray-700/30";
  const safeDuration = Number(course.totalDuration || 0);
  const safeRating = Number(course.rating || 0);
  const rawTotalReviews = Number(course.totalReviews || course.reviews || 0);
  const safeTotalReviews = Math.max(rawTotalReviews, userReview ? 1 : 0);
  const courseType = String(course.type || "recorded").toLowerCase();
  const isLiveCourse = courseType === "live";

  return (
    <div
      className="relative z-0 bg-[#111] border border-gray-800 rounded-xl overflow-visible hover:border-gray-600 hover:z-30
        transition-colors group flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={course.thumbnail?.secure_url || `https://picsum.photos/seed/${course._id}/400/200`}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${levelClasses}`}>
              {course.level || "beginner"}
            </span>
            <StatusBadge
              label={isLiveCourse ? "Live Batch" : "Recorded"}
              className={isLiveCourse
                ? "text-green-300 bg-green-500/15 border-green-500/30"
                : "text-blue-300 bg-blue-500/15 border-blue-500/30"}
            />
          </div>
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
            src={instructorObj?.profilePicture?.secure_url}
            name={instructorName}
            size="sm"
          />
          <p className="text-gray-500 text-xs truncate">
            {instructorName}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-400 text-xs font-semibold">{safeRating.toFixed(1)}</span>
          <span className="text-gray-600 text-xs">({safeTotalReviews})</span>
          <span className="text-gray-700 mx-1">·</span>
          <Clock className="w-3 h-3 text-gray-600" />
          <span className="text-gray-600 text-xs">{formatDuration(safeDuration)}</span>
        </div>

        <div className="mb-3">
          <CourseRatingHover
            courseId={course._id}
            rating={safeRating}
            totalReviews={safeTotalReviews}
            size="md"
          />
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
          <div className="grid grid-cols-1 gap-2">
            <Link
              to={`/dashboard/learn/${course._id}`}
              className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-400 text-black
                font-semibold text-sm rounded-xl hover:bg-yellow-300 transition-colors active:scale-95"
            >
              <Play className="w-3 h-3 fill-black" />
              Continue
            </Link>
            <Link
              to={`/dashboard/doubt-tickets?courseId=${course._id}&title=${encodeURIComponent(isLiveCourse ? "Live batch doubt" : "Recorded lesson doubt")}`}
              className="w-full text-center py-2 rounded-xl border border-gray-700 text-gray-300 text-xs font-medium hover:border-yellow-400/40 hover:text-yellow-300 transition-colors"
            >
              Book Doubt Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
