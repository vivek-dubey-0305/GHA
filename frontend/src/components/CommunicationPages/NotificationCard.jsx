/**
 * components/CommunicationPages/NotificationCard.jsx
 */
import { motion } from "framer-motion";
import { timeAgo } from "../../utils/format.utils";
import { NOTIFICATION_TYPES } from "../../constants/dashboard.constants";

export default function NotificationCard({ notification, delay = 0, onOpen }) {
  const { title, message, type, isRead, createdAt } = notification;
  const cfg = NOTIFICATION_TYPES[type] ?? NOTIFICATION_TYPES.general;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={() => onOpen?.(notification)}
      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer
        ${!isRead
          ? "bg-yellow-400/3 border-yellow-400/10 hover:border-yellow-400/20"
          : "bg-[#111] border-gray-800 hover:border-gray-700"
        }`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0
        ${!isRead ? "bg-yellow-400/10" : "bg-gray-800"}`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${!isRead ? "text-white" : "text-gray-300"}`}>
            {title}
          </p>
          {!isRead && (
            <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">{message}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
            {cfg.label}
          </span>
          <span className="text-gray-700 text-xs">{timeAgo(createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
}
