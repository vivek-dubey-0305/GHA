/**
 * components/AccountPages/ReviewCard.jsx
 */
import { motion } from "framer-motion";
import { Star, Edit2, CheckCircle } from "lucide-react";
import { formatDate } from "../../utils/format.utils";

export default function ReviewCard({ review, delay = 0, onEdit }) {
  const { title, comment, rating, course, isVerified, helpful, createdAt } = review;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
    >
      {/* Course */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <img
            src={course?.thumbnail?.secure_url}
            alt=""
            className="w-12 h-12 rounded-xl object-cover border border-gray-800 shrink-0"
          />
          <div>
            <p className="text-white font-semibold text-sm line-clamp-1">{course?.title}</p>
            <p className="text-gray-600 text-xs">{formatDate(createdAt)}</p>
          </div>
        </div>
        <button
          onClick={() => onEdit?.(review)}
          className="p-2 text-gray-600 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors shrink-0"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`}
          />
        ))}
        <span className="ml-2 text-gray-500 text-xs font-medium">{rating}/5</span>
      </div>

      <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
      <p className="text-gray-400 text-xs leading-relaxed mb-4">{comment}</p>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-3">
          {isVerified && (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle className="w-3 h-3" /> Verified Purchase
            </span>
          )}
        </div>
        <span>{helpful} found helpful</span>
      </div>
    </motion.div>
  );
}
