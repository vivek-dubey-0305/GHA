/**
 * components/AssignmentPages/AssignmentFeedback.jsx
 * Shows graded submission feedback in a modal-like panel.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MessageSquare } from "lucide-react";
import { ProgressBar, Avatar } from "../DashboardPages/DashboardUI";
import { formatDateTime, scoreColor } from "../../utils/format.utils";

export default function AssignmentFeedback({ submission, assignment, onClose }) {
  if (!submission) return null;
  const pct = (submission.score / assignment.maxScore) * 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <h2 className="text-white font-bold">Assignment Feedback</h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <h3 className="text-white font-semibold text-sm">{assignment.title}</h3>
              <p className="text-gray-500 text-xs mt-0.5">{assignment.course?.title}</p>
            </div>

            {/* Score */}
            <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-semibold">Score</span>
                </div>
                <span className={`text-2xl font-black ${scoreColor(submission.score)}`}>
                  {submission.score}<span className="text-gray-600 text-base">/{assignment.maxScore}</span>
                </span>
              </div>
              <ProgressBar value={pct} />
              <p className="text-xs text-gray-600 mt-2 text-right">
                {pct >= 60 ? "✅ Passed" : "❌ Below passing score"}
              </p>
            </div>

            {/* Feedback */}
            {submission.feedback && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-semibold text-sm">Instructor Feedback</span>
                </div>
                <div className="bg-black/30 border border-gray-800 rounded-xl p-4">
                  <p className="text-gray-300 text-sm leading-relaxed">{submission.feedback}</p>
                </div>
              </div>
            )}

            {/* Meta */}
            <p className="text-xs text-gray-600 text-center">
              Graded on {formatDateTime(submission.gradedAt)} by{" "}
              {submission.gradedBy?.firstName} {submission.gradedBy?.lastName}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
