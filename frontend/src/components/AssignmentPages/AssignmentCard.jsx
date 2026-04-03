/**
 * components/AssignmentPages/AssignmentCard.jsx
 */
import { motion } from "framer-motion";
import { FileText, Clock, ChevronRight } from "lucide-react";
import { StatusBadge, ProgressBar } from "../DashboardPages/DashboardUI";
import { formatDate, scoreColor } from "../../utils/format.utils";
import { ASSIGNMENT_STATUS } from "../../constants/dashboard.constants";

export default function AssignmentCard({ assignment, submission, delay = 0, onOpen }) {
  const daysLeft = Math.ceil((new Date(assignment.dueDate) - Date.now()) / 864e5);
  const isOverdue = daysLeft < 0;
  const displayStatus = isOverdue && assignment.status === "pending" ? "overdue" : assignment.status;
  const cfg = ASSIGNMENT_STATUS[displayStatus] ?? ASSIGNMENT_STATUS.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onOpen}
      className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors
        cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-white/5 shrink-0">
          <FileText className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex items-center gap-2">
          {isOverdue && (
            <StatusBadge
              label="Overdue"
              className="text-red-300 bg-red-500/15 border-red-500/35"
            />
          )}
          <StatusBadge label={cfg.label} className={cfg.color} />
        </div>
      </div>

      <h3 className="text-white font-semibold text-sm mb-1 leading-snug">{assignment.title}</h3>
      <p className="text-gray-500 text-xs mb-1">{assignment.course?.title}</p>
      <p className="text-gray-600 text-xs mb-4 line-clamp-2">{assignment.description}</p>

      {/* Due date */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${isOverdue ? "text-red-400" : "text-gray-600"}`} />
          <span className={isOverdue ? "text-red-400" : "text-gray-600"}>
            {isOverdue ? `Overdue (${formatDate(assignment.dueDate)})` : `Due ${formatDate(assignment.dueDate)}`}
          </span>
        </div>
        <span className={`font-semibold ${isOverdue ? "text-red-400" : "text-yellow-400"}`}>
          {isOverdue ? "Overdue" : `${daysLeft}d left`}
        </span>
      </div>

      {/* Score (if graded) */}
      {submission?.score !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Score</span>
            <span className={`text-sm font-bold ${scoreColor(submission.score)}`}>
              {submission.score}/{assignment.maxScore}
            </span>
          </div>
          <ProgressBar value={(submission.score / assignment.maxScore) * 100} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
        <span className="text-xs text-gray-600">Max: {assignment.maxScore} pts · Pass: {assignment.passingScore}</span>
        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
      </div>
    </motion.div>
  );
}
