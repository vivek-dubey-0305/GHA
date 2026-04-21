/**
 * components/CommunityPages/DiscussionThread.jsx
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, ThumbsUp, CheckCircle, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { Avatar, YellowButton } from "../DashboardPages/DashboardUI";
import { timeAgo } from "../../utils/format.utils";

export default function DiscussionThread({ discussion, onClose, onReply, replyLoading = false }) {
  const [replyText, setReplyText] = useState("");

  if (!discussion) return null;

  const authorName = (a) => `${a?.firstName ?? ""} ${a?.lastName ?? ""}`.trim();

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !onReply) return;
    const ok = await onReply(replyText.trim());
    if (ok) {
      setReplyText("");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-800 gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-sm leading-snug">{discussion.title}</h2>
              <p className="text-gray-500 text-xs mt-1">{discussion.course?.title}</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* OP */}
            <div className="flex gap-3">
              <Avatar src={discussion.author?.profilePicture?.secure_url} name={authorName(discussion.author)} size="md" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">{authorName(discussion.author)}</span>
                  {discussion.authorRole === "Instructor" && (
                    <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1.5 py-0.5 rounded-full">Instructor</span>
                  )}
                  <span className="text-gray-600 text-xs">{timeAgo(discussion.createdAt)}</span>
                </div>
                <div className="bg-black/30 border border-gray-800 rounded-xl p-3">
                  <p className="text-gray-300 text-sm leading-relaxed">{discussion.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-yellow-400 transition-colors">
                    <ThumbsUp className="w-3 h-3" /> {discussion.upvotes?.length ?? 0} upvotes
                  </button>
                  {discussion.isResolved && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-3 h-3" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Replies */}
            {discussion.replies?.length > 0 && (
              <div className="space-y-4 pl-4 border-l border-gray-800 ml-5">
                {discussion.replies.map((reply, i) => (
                  <div key={reply._id ?? i} className="flex gap-3">
                    <Avatar
                      src={reply.author?.profilePicture?.secure_url}
                      name={authorName(reply.author)}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-xs">{authorName(reply.author)}</span>
                        {reply.authorRole === "Instructor" && (
                          <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-1.5 py-0.5 rounded-full">Instructor</span>
                        )}
                        <span className="text-gray-600 text-xs">{timeAgo(reply.createdAt)}</span>
                      </div>
                      <div className="bg-black/20 border border-gray-800 rounded-xl p-3">
                        <p className="text-gray-300 text-sm leading-relaxed">{reply.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reply input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                rows={2}
                className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white
                  placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 resize-none transition-colors"
              />
              <YellowButton
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || replyLoading}
                className="self-end h-10 px-4"
              >
                {replyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </YellowButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
