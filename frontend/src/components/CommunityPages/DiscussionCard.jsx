/**
 * components/CommunityPages/DiscussionCard.jsx
 */
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, CheckCircle, Pin } from "lucide-react";
import { Avatar } from "../DashboardPages/DashboardUI";
import { timeAgo } from "../../utils/format.utils";

export function DiscussionCard({ discussion, delay = 0, onClick }) {
  const { title, content, author, authorRole, course, replies, upvotes, isResolved, isPinned, tags, createdAt } = discussion;
  const authorName = `${author?.firstName} ${author?.lastName}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors cursor-pointer group"
    >
      {/* Flags */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {isPinned && (
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
            <Pin className="w-2.5 h-2.5" /> Pinned
          </span>
        )}
        {isResolved && (
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
            <CheckCircle className="w-2.5 h-2.5" /> Resolved
          </span>
        )}
        {tags?.slice(0, 2).map((tag) => (
          <span key={tag} className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">#{tag}</span>
        ))}
      </div>

      <h3 className="text-white font-semibold text-sm leading-snug mb-1.5 group-hover:text-yellow-300 transition-colors">
        {title}
      </h3>
      <p className="text-gray-500 text-xs line-clamp-2 mb-4">{content}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar src={author?.profilePicture?.secure_url} name={authorName} size="sm" />
          <div>
            <span className="text-gray-400 text-xs">{authorName}</span>
            {authorRole === "Instructor" && (
              <span className="ml-1.5 text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1.5 py-0.5 rounded-full">Instructor</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{upvotes?.length ?? 0}</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{replies?.length ?? 0}</span>
          <span>{timeAgo(createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
}
