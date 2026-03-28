import { MessageCircle, Paperclip } from "lucide-react";
import { DOUBT_STATUS_COLOR, DOUBT_STATUS_LABEL } from "../../constants/doubtTicket.constants";
import { timeAgo } from "../../utils/format.utils";

export default function DoubtTicketCard({ ticket, onOpen }) {
  const status = ticket?.status || "open";
  return (
    <button
      onClick={() => onOpen?.(ticket)}
      className="w-full text-left bg-[#111] border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-white font-semibold text-sm line-clamp-1">{ticket.title}</h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${DOUBT_STATUS_COLOR[status] || DOUBT_STATUS_COLOR.open}`}>
          {DOUBT_STATUS_LABEL[status] || status}
        </span>
      </div>

      <p className="text-gray-500 text-xs line-clamp-2 mb-3">{ticket.description}</p>

      <div className="flex items-center gap-3 text-[11px] text-gray-600">
        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{ticket.replies?.length || 0} replies</span>
        <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" />{ticket.attachments?.length || 0}</span>
        <span>{timeAgo(ticket.createdAt)}</span>
      </div>
    </button>
  );
}
