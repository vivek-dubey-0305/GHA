import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HelpCircle, CheckCircle, Send, ArrowLeft, ImagePlus, X } from "lucide-react";
import { io } from "socket.io-client";
import { InstructorLayout } from "../../components/layout/InstructorLayout";
import { SuccessToast, ErrorToast } from "../../components/ui";
import {
  getAssignedDoubtTickets,
  getAssignedDoubtTicketById,
  acceptDoubtTicket,
  resolveDoubtTicket,
  addInstructorDoubtReply,
  appendReplyToCurrentTicket,
} from "../../redux/slices/doubtTicket.slice";

export default function DoubtTickets() {
  const dispatch = useDispatch();
  const { tickets, currentTicket, loading, pagination } = useSelector((s) => s.doubtTicket);
  const [view, setView] = useState("list");
  const [replyText, setReplyText] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [replyImages, setReplyImages] = useState([]);
  const [accepting, setAccepting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [replying, setReplying] = useState(false);
  const [toastState, setToastState] = useState({ visible: false, type: "success", title: "", message: "" });
  const repliesEndRef = useRef(null);
  const replyInputRef = useRef(null);

  const showToast = (type, title, message) => {
    setToastState({ visible: true, type, title, message });
  };

  const fetchTickets = useCallback(() => {
    dispatch(getAssignedDoubtTickets({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (view !== "detail" || !currentTicket?._id) return;

    const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");
    const socket = io(base, { transports: ["websocket"], withCredentials: true });
    const ticketId = String(currentTicket._id);

    socket.on("connect", () => {
      socket.emit("join_doubt_ticket", { ticketId });
    });

    const onNewReply = async (payload) => {
      if (String(payload?.ticketId || "") !== ticketId) return;
      if (!payload?.reply) return;
      dispatch(appendReplyToCurrentTicket({
        ticketId,
        reply: payload.reply,
        nextStatus: payload?.senderRole === "Instructor" ? "accepted" : undefined,
      }));
    };

    socket.on("doubt_ticket:new_reply", onNewReply);

    return () => {
      socket.emit("leave_doubt_ticket", { ticketId });
      socket.off("doubt_ticket:new_reply", onNewReply);
      socket.disconnect();
    };
  }, [view, currentTicket?._id, dispatch, fetchTickets]);

  const openTicket = (id) => {
    dispatch(getAssignedDoubtTicketById(id));
    setView("detail");
    setReplyText("");
    setReplyImages([]);
    setResolutionNote("");
  };

  const onAccept = async () => {
    if (!currentTicket?._id || accepting) return;
    if (currentTicket?.status !== "open") {
      showToast("error", "Cannot Accept", `Ticket is already ${currentTicket?.status || "processed"}.`);
      return;
    }

    setAccepting(true);
    const result = await dispatch(acceptDoubtTicket(currentTicket._id));
    if (result?.error) {
      showToast("error", "Accept Failed", result?.payload || "Unable to accept ticket");
      setAccepting(false);
      return;
    }

    await dispatch(getAssignedDoubtTicketById(currentTicket._id));
    fetchTickets();
    setAccepting(false);
    showToast("success", "Ticket Accepted", "Doubt ticket has been accepted.");
  };

  const onResolve = async () => {
    if (!currentTicket?._id || resolving) return;
    if (!["accepted", "in_progress"].includes(currentTicket?.status)) {
      showToast("error", "Cannot Resolve", "Accept this ticket first before resolving.");
      return;
    }

    setResolving(true);
    const result = await dispatch(resolveDoubtTicket({ id: currentTicket._id, resolutionNote }));
    if (result?.error) {
      showToast("error", "Resolve Failed", result?.payload || "Unable to resolve ticket");
      setResolving(false);
      return;
    }

    await dispatch(getAssignedDoubtTicketById(currentTicket._id));
    fetchTickets();
    setResolving(false);
    showToast("success", "Ticket Resolved", "Doubt ticket has been resolved.");
  };

  const onReply = async () => {
    if (!currentTicket?._id || replying) return;
    if (!replyText.trim() && replyImages.length === 0) return;

    setReplying(true);
    const result = await dispatch(addInstructorDoubtReply({
      id: currentTicket._id,
      content: replyText.trim(),
      images: replyImages,
    }));
    if (result?.error) {
      showToast("error", "Reply Failed", result?.payload || "Unable to send reply");
      setReplying(false);
      return;
    }
    setReplyText("");
    setReplyImages([]);
    replyInputRef.current?.focus();
    setReplying(false);
    showToast("success", "Reply Sent", "Your reply was sent to the student.");
  };

  useEffect(() => {
    if (view !== "detail" || !currentTicket?._id) return;
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [view, currentTicket?._id, currentTicket?.replies]);

  const onPickImages = (event) => {
    const selected = Array.from(event.target.files || []);
    const onlyImages = selected.filter((file) => String(file.type || "").startsWith("image/"));
    setReplyImages((prev) => [...prev, ...onlyImages].slice(0, 6));
  };

  const removeReplyImage = (index) => {
    setReplyImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const displayReplyName = (reply) => {
    const firstName = reply?.author?.firstName || "";
    const lastName = reply?.author?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || (reply?.authorRole === "Instructor" ? "Instructor" : "Student");
  };

  const canAccept = currentTicket?.status === "open";
  const canResolve = ["accepted", "in_progress"].includes(currentTicket?.status);
  const isChatLocked = ["resolved", "closed"].includes(currentTicket?.status);

  if (view === "detail" && currentTicket) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <button
            onClick={() => {
              setView("list");
              fetchTickets();
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Doubt Tickets
          </button>

          <div className="bg-[#111] border border-gray-800 rounded-xl p-5 space-y-3">
            <h2 className="text-xl font-bold text-white">{currentTicket.title}</h2>
            <p className="text-gray-400 text-sm">{currentTicket.description}</p>
            {currentTicket.notes ? <p className="text-gray-500 text-xs">Notes: {currentTicket.notes}</p> : null}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onAccept}
                disabled={!canAccept || accepting || resolving || replying}
                className="px-3 py-1.5 rounded-lg text-xs border border-blue-500/40 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {accepting ? "Accepting..." : canAccept ? "Accept" : "Accepted"}
              </button>
              <button
                onClick={onResolve}
                disabled={!canResolve || resolving || accepting || replying}
                className="px-3 py-1.5 rounded-lg text-xs border border-green-500/40 text-green-300 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resolving ? "Resolving..." : currentTicket?.status === "resolved" ? "Resolved" : "Resolve"}
              </button>
              <input
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Resolution note"
                className="min-w-56 bg-[#0a0a0a] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                disabled={currentTicket?.status === "resolved" || resolving}
              />
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-xl p-3 sm:p-4">
            <div className="max-h-[46vh] overflow-y-auto pr-1 flex flex-col gap-2">
              {(currentTicket.replies || []).length === 0 ? (
                <div className="text-xs text-gray-500 bg-[#0d0d0d] border border-gray-800 rounded-lg p-3">
                  No replies yet.
                </div>
              ) : (currentTicket.replies || []).map((reply, index) => {
                const isSelf = reply?.authorRole === "Instructor";
                const replyImagesList = Array.isArray(reply?.images) ? reply.images : [];
                return (
                  <div
                    key={reply._id || index}
                    className={`max-w-[84%] rounded-2xl border px-3 py-2 ${isSelf ? "self-end bg-blue-500/10 border-blue-500/30" : "self-start bg-[#0d0d0d] border-gray-800"}`}
                  >
                    <p className={`text-[11px] mb-1 ${isSelf ? "text-blue-300" : "text-yellow-300"}`}>
                      {displayReplyName(reply)}
                      <span className="text-gray-500"> • {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ""}</span>
                    </p>
                    {reply.content ? (
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{reply.content}</p>
                    ) : null}
                    {replyImagesList.length > 0 ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {replyImagesList.map((image, imageIndex) => (
                          <a key={`${image.secure_url}-${imageIndex}`} href={image.secure_url} target="_blank" rel="noreferrer">
                            <img src={image.secure_url} alt={image.originalName || "Reply image"} className="w-full h-24 object-cover rounded-lg border border-gray-700" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <div ref={repliesEndRef} />
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <textarea
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              placeholder={isChatLocked ? "Ticket resolved. Chat is read-only." : "Write a reply"}
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white resize-none"
              disabled={replying || isChatLocked}
            />

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:text-white cursor-pointer">
                <ImagePlus className="w-3.5 h-3.5" /> Add images
                <input type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} disabled={replying || isChatLocked} />
              </label>
              {replyImages.map((file, index) => (
                <div key={`${file.name}-${index}`} className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-[#0a0a0a] border border-gray-800 text-gray-300">
                  <span className="max-w-32 truncate">{file.name}</span>
                  <button type="button" onClick={() => removeReplyImage(index)} className="text-gray-500 hover:text-white" disabled={replying}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={onReply}
              disabled={replying || isChatLocked || (!replyText.trim() && replyImages.length === 0)}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" /> {replying ? "Sending..." : "Send Reply"}
            </button>
            {isChatLocked ? (
              <p className="text-xs text-gray-500 mt-2">This ticket is resolved. Chat is read-only now.</p>
            ) : null}
          </div>
        </div>

        <SuccessToast
          isVisible={toastState.visible && toastState.type === "success"}
          onDismiss={() => setToastState((prev) => ({ ...prev, visible: false }))}
          title={toastState.title || "Success"}
          message={toastState.message || "Done"}
          duration={3500}
        />
        <ErrorToast
          isVisible={toastState.visible && toastState.type === "error"}
          onDismiss={() => setToastState((prev) => ({ ...prev, visible: false }))}
          title={toastState.title || "Error"}
          message={toastState.message || "Something went wrong"}
          duration={4500}
        />
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-7 h-7 text-white" />
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Doubt Tickets</h1>
        </div>

        {loading && tickets.length === 0 ? (
          <p className="text-gray-500 text-sm">Loading doubt tickets...</p>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <CheckCircle className="w-14 h-14 text-gray-700 mb-3" />
            <h3 className="text-lg font-semibold text-white">No assigned doubt tickets</h3>
            <p className="text-gray-500 text-sm">New tickets will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <button
                key={ticket._id}
                onClick={() => openTicket(ticket._id)}
                className="w-full text-left bg-[#111] border border-gray-800 rounded-xl p-4 hover:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-white text-sm font-semibold line-clamp-1">{ticket.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{ticket.status}</span>
                </div>
                <p className="text-gray-500 text-xs line-clamp-1">{ticket.description}</p>
                <p className="text-gray-600 text-[11px] mt-1">{ticket.user?.firstName} {ticket.user?.lastName}</p>
              </button>
            ))}
          </div>
        )}

        {pagination?.totalPages > 1 ? (
          <p className="text-xs text-gray-600">Page {pagination.currentPage} of {pagination.totalPages}</p>
        ) : null}
      </div>

      <SuccessToast
        isVisible={toastState.visible && toastState.type === "success"}
        onDismiss={() => setToastState((prev) => ({ ...prev, visible: false }))}
        title={toastState.title || "Success"}
        message={toastState.message || "Done"}
        duration={3500}
      />
      <ErrorToast
        isVisible={toastState.visible && toastState.type === "error"}
        onDismiss={() => setToastState((prev) => ({ ...prev, visible: false }))}
        title={toastState.title || "Error"}
        message={toastState.message || "Something went wrong"}
        duration={4500}
      />
    </InstructorLayout>
  );
}
