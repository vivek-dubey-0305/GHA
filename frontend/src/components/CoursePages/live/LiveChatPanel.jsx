import { Send, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";

const formatTime = (value) => {
  const date = new Date(value || Date.now());
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function LiveChatPanel({ messages = [], onSend, sending = false, error = "" }) {
  const [draft, setDraft] = useState("");

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    const ok = await onSend?.(text);
    if (ok) setDraft("");
  };

  return (
    <div className="h-full flex flex-col rounded-xl border border-gray-800 bg-[#101010]">
      <div className="px-3 py-2.5 border-b border-gray-800 flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-wide text-gray-400">Live Chat</h4>
        <MessageSquare className="w-4 h-4 text-gray-500" />
      </div>

      <div className="live-chat-scroll flex-1 overflow-auto p-3 space-y-2" role="log" aria-live="polite">
        {error ? <p className="text-xs text-amber-300 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1">{error}</p> : null}
        {orderedMessages.length === 0 ? (
          <p className="text-xs text-gray-500">No messages yet. Start the conversation.</p>
        ) : (
          orderedMessages.map((message, index) => (
            <div key={`${message.sender || "na"}-${message.timestamp || index}-${index}`} className="rounded-lg bg-[#181818] border border-gray-800 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] text-yellow-300 truncate">{message?.senderName || "Participant"}</p>
                <span className="text-[10px] text-gray-500 shrink-0">{formatTime(message?.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-200 mt-1 wrap-break-word">{message?.message}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-800 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message"
          className="flex-1 h-9 rounded-lg border border-gray-700 bg-[#151515] text-sm px-3 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-yellow-400"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="h-9 w-9 rounded-lg inline-flex items-center justify-center bg-yellow-400 text-black disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <style>{`
        .live-chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: #facc15 #171717;
        }

        .live-chat-scroll::-webkit-scrollbar {
          width: 10px;
        }

        .live-chat-scroll::-webkit-scrollbar-track {
          background: #171717;
          border-radius: 999px;
        }

        .live-chat-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #facc15 0%, #dc2626 100%);
          border-radius: 999px;
          border: 2px solid #171717;
        }
      `}</style>
    </div>
  );
}
