import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { HelpCircle, Send, ArrowRight, ArrowLeft, ImagePlus, X } from "lucide-react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState, SearchBar } from "../../components/DashboardPages/DashboardUI";
import { apiClient } from "../../utils/api.utils";
import DoubtTicketCard from "../../components/DoubtTicketPages/DoubtTicketCard";
import DoubtTicketForm from "../../components/DoubtTicketPages/DoubtTicketForm";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice";
import { SuccessToast, ErrorToast } from "../../components/ui";
import { DOUBT_STATUS_LABEL, DOUBT_STATUS_COLOR } from "../../constants/doubtTicket.constants";

export default function DoubtTickets() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { myEnrollments } = useSelector((state) => state.enrollment);
  const [tickets, setTickets] = useState([]);
  const [quota, setQuota] = useState({ limit: 3, used: 0, remaining: 3 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyImages, setReplyImages] = useState([]);
  const [toastState, setToastState] = useState({ visible: false, type: "success", title: "", message: "" });
  const repliesEndRef = useRef(null);
  const replyInputRef = useRef(null);
  const createFormRef = useRef(null);

  const appendReplyUnique = useCallback((ticket, nextReply) => {
    if (!ticket || !nextReply) return ticket;
    const existingReplies = Array.isArray(ticket.replies) ? ticket.replies : [];
    const hasReply = existingReplies.some((reply) => String(reply?._id) === String(nextReply?._id));
    if (hasReply) return ticket;
    return {
      ...ticket,
      replies: [...existingReplies, nextReply],
    };
  }, []);

  const showToast = (type, title, message) => {
    setToastState({ visible: true, type, title, message });
  };

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/doubt-tickets/user/my?limit=50");
      setTickets(res?.data?.data?.tickets || []);
      setQuota(res?.data?.data?.quota || { limit: 3, used: 0, remaining: 3 });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load doubt tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTicketDetail = useCallback(async (ticketId) => {
    if (!ticketId) {
      setSelectedTicketId("");
      setSelectedTicket(null);
      return;
    }

    setTicketLoading(true);
    try {
      const res = await apiClient.get(`/doubt-tickets/user/${ticketId}`);
      setSelectedTicketId(ticketId);
      setSelectedTicket(res?.data?.data || null);
    } catch (err) {
      showToast("error", "Failed", err?.response?.data?.message || "Could not load ticket detail");
    } finally {
      setTicketLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (activeTab !== "status" || !selectedTicketId) return;

    const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");
    const socket = io(base, { transports: ["websocket"], withCredentials: true });

    socket.on("connect", () => {
      socket.emit("join_doubt_ticket", { ticketId: selectedTicketId });
    });

    const onNewReply = async (payload) => {
      if (String(payload?.ticketId || "") !== String(selectedTicketId)) return;
      if (!payload?.reply) return;
      setSelectedTicket((prev) => {
        if (!prev || String(prev?._id) !== String(selectedTicketId)) return prev;
        const updated = appendReplyUnique(prev, payload.reply);
        if (payload?.senderRole === "Instructor" && updated?.status === "open") {
          return { ...updated, status: "accepted" };
        }
        return updated;
      });
    };

    socket.on("doubt_ticket:new_reply", onNewReply);

    return () => {
      socket.emit("leave_doubt_ticket", { ticketId: selectedTicketId });
      socket.off("doubt_ticket:new_reply", onNewReply);
      socket.disconnect();
    };
  }, [activeTab, selectedTicketId, appendReplyUnique]);

  const enrolledCourses = (myEnrollments || [])
    .filter((enrollment) => ["active", "completed"].includes(enrollment?.status))
    .map((enrollment) => {
      const course = enrollment?.course || {};
      return {
        id: String(course?._id || course || ""),
        title: course?.title || "Untitled Course",
        type: String(course?.type || "recorded").toLowerCase(),
      };
    })
    .filter((course) => course.id);

  const prefills = useMemo(() => {
    const courseId = searchParams.get("courseId") || "";
    const title = searchParams.get("title") || "";
    const description = searchParams.get("description") || "";
    const notes = searchParams.get("notes") || "";

    return { courseId, title, description, notes };
  }, [searchParams]);

  useEffect(() => {
    if (!prefills.courseId && !prefills.title && !prefills.description && !prefills.notes) return;
    setActiveTab("create");
    createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [prefills]);

  const handleCreate = async ({ courseId, title, description, notes, files }) => {
    setCreating(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("courseId", courseId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("notes", notes || "");
      files.forEach((file) => formData.append("attachments", file));

      await apiClient.post("/doubt-tickets/user", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await loadTickets();
      showToast("success", "Ticket Created", "Your doubt ticket has been created and sent to the instructor.");
      setActiveTab("status");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to create doubt ticket";
      setError(message);
      showToast("error", "Create Failed", message);
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicketId || replying) return;
    if (!replyText.trim() && replyImages.length === 0) return;

    setReplying(true);
    try {
      const formData = new FormData();
      if (replyText.trim()) formData.append("content", replyText.trim());
      replyImages.forEach((file) => formData.append("images", file));

      const res = await apiClient.post(`/doubt-tickets/user/${selectedTicketId}/replies`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const createdReply = res?.data?.data || null;
      setReplyText("");
      setReplyImages([]);
      if (createdReply) {
        setSelectedTicket((prev) => appendReplyUnique(prev, createdReply));
      }
      replyInputRef.current?.focus();
      showToast("success", "Reply Sent", "Your message was sent to the instructor.");
    } catch (err) {
      showToast("error", "Reply Failed", err?.response?.data?.message || "Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  useEffect(() => {
    if (!selectedTicketId) return;
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedTicket?.replies, selectedTicketId]);

  const onPickReplyImages = (event) => {
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
    return fullName || (reply?.authorRole === "Instructor" ? "Instructor" : "You");
  };

  const filtered = tickets.filter((ticket) => {
    const hay = `${ticket.title || ""} ${ticket.description || ""} ${ticket.status || ""}`.toLowerCase();
    const statusMatch = statusFilter === "all" ? true : ticket?.status === statusFilter;
    if (!statusMatch) return false;
    return hay.includes(query.toLowerCase());
  });

  const statusCounts = useMemo(() => {
    const counts = {
      all: tickets.length,
      open: 0,
      accepted: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    tickets.forEach((ticket) => {
      if (counts[ticket.status] !== undefined) counts[ticket.status] += 1;
    });

    return counts;
  }, [tickets]);

  const statusFilterOptions = ["all", "open", "accepted", "in_progress", "resolved", "closed"];
  const isChatLocked = ["resolved", "closed"].includes(selectedTicket?.status);

  const limitReached = quota.remaining <= 0;

  return (
    <UserLayout>
      <PageShell
        title="Doubt Tickets"
        subtitle={`Daily limit: ${quota.used}/${quota.limit} used (IST)`}
      >
        <div className="space-y-4">
          <div className="inline-flex rounded-xl border border-gray-800 bg-[#0d0d0d] p-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 text-sm rounded-lg transition ${activeTab === "create" ? "bg-yellow-400 text-black font-semibold" : "text-gray-300 hover:text-white"}`}
            >
              Create Ticket
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("status")}
              className={`px-4 py-2 text-sm rounded-lg transition ${activeTab === "status" ? "bg-yellow-400 text-black font-semibold" : "text-gray-300 hover:text-white"}`}
            >
              Ticket Status
            </button>
          </div>

          {activeTab === "create" ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-1">
                <div className="mb-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
                  <p className="text-xs font-semibold text-cyan-300">Greed AI Doubt Solver: Coming Soon</p>
                  <p className="text-xs text-gray-300 mt-1">
                    AI doubt resolution is under development. For now, directly book with instructors using the form below.
                  </p>
                </div>

                <div ref={createFormRef}>
                <DoubtTicketForm
                  onSubmit={handleCreate}
                  enrolledCourses={enrolledCourses}
                  loading={creating}
                  disabled={limitReached}
                  initialValues={prefills}
                />
                </div>
                {limitReached && (
                  <p className="text-xs text-yellow-400 mt-2">Daily limit reached. You can submit more tickets after IST midnight.</p>
                )}
                {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
              </div>

              <div className="xl:col-span-2 space-y-3">
                <SearchBar value={query} onChange={setQuery} placeholder="Search your doubt tickets" />

                {loading ? (
                  <p className="text-gray-500 text-sm">Loading doubt tickets...</p>
                ) : filtered.length === 0 ? (
                  <EmptyState icon={HelpCircle} title="No doubt tickets yet" subtitle="Create your first ticket from the form." />
                ) : (
                  <div className="space-y-2">
                    {filtered.slice(0, 6).map((ticket) => (
                      <DoubtTicketCard key={ticket._id} ticket={ticket} onOpen={() => {
                        setActiveTab("status");
                        loadTicketDetail(ticket._id);
                      }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-4">
              <div className="space-y-3">
                <SearchBar value={query} onChange={setQuery} placeholder="Search by title or status" />

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-2">
                  {statusFilterOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`text-xs px-2.5 py-2 rounded-lg border transition ${
                        statusFilter === status
                          ? "border-yellow-400 bg-yellow-400/15 text-yellow-300"
                          : "border-gray-800 bg-[#101010] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {(DOUBT_STATUS_LABEL[status] || status).replace("In Progress", "In-Progress")}
                      <span className="ml-1.5 text-[10px] text-gray-500">{statusCounts[status] ?? 0}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 max-h-[65vh] overflow-auto pr-1">
                  {loading ? (
                    <p className="text-gray-500 text-sm">Loading doubt tickets...</p>
                  ) : filtered.length === 0 ? (
                    <EmptyState icon={HelpCircle} title="No tickets in this filter" subtitle="Try changing the status filter." />
                  ) : (
                    filtered.map((ticket) => (
                      <DoubtTicketCard
                        key={ticket._id}
                        ticket={ticket}
                        onOpen={() => loadTicketDetail(ticket._id)}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="bg-[#111] border border-gray-800 rounded-xl p-4 sm:p-5 min-h-105">
                {!selectedTicketId ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                    <ArrowRight className="w-9 h-9 mb-2 text-gray-700" />
                    <p className="text-sm">Select a ticket to view full status and replies.</p>
                  </div>
                ) : ticketLoading ? (
                  <p className="text-gray-500 text-sm">Loading ticket details...</p>
                ) : !selectedTicket ? (
                  <p className="text-red-400 text-sm">Could not load ticket details.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-white text-base sm:text-lg font-semibold line-clamp-1">{selectedTicket.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">Course: {selectedTicket?.course?.title || "N/A"}</p>
                        <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{selectedTicket.description}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-full border whitespace-nowrap ${DOUBT_STATUS_COLOR[selectedTicket.status] || DOUBT_STATUS_COLOR.open}`}>
                        {DOUBT_STATUS_LABEL[selectedTicket.status] || selectedTicket.status}
                      </span>
                    </div>

                    {selectedTicket.notes ? (
                      <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-3">
                        <p className="text-[11px] text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedTicket.notes}</p>
                      </div>
                    ) : null}

                    <div className="border-t border-gray-800 pt-3">
                      <label className="text-xs text-gray-500 mb-1.5 block">Reply to instructor</label>
                      <div className="max-h-[46vh] overflow-y-auto pr-1 flex flex-col gap-2 mb-3">
                        {(selectedTicket.replies || []).length === 0 ? (
                          <div className="text-xs text-gray-500 bg-[#0d0d0d] border border-gray-800 rounded-lg p-3">
                            No replies yet. Start the conversation below.
                          </div>
                        ) : (
                          (selectedTicket.replies || []).map((reply, index) => {
                            const isSelf = reply?.authorRole === "User";
                            const replyImagesList = Array.isArray(reply?.images) ? reply.images : [];
                            return (
                              <div
                                key={reply._id || `${reply.createdAt}-${index}`}
                                className={`max-w-[84%] rounded-2xl border px-3 py-2 ${isSelf ? "self-end bg-yellow-400/10 border-yellow-400/30" : "self-start bg-[#0d0d0d] border-gray-800"}`}
                              >
                                <p className={`text-[11px] mb-1 ${isSelf ? "text-yellow-300" : "text-blue-300"}`}>
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
                          })
                        )}
                        <div ref={repliesEndRef} />
                      </div>

                      <textarea
                        ref={replyInputRef}
                        rows={3}
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        placeholder={isChatLocked ? "Ticket resolved. Chat is read-only." : "Type your follow-up..."}
                        className="w-full rounded-lg bg-[#0a0a0a] border border-gray-800 px-3 py-2 text-sm text-white resize-none"
                        disabled={replying || isChatLocked}
                      />

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:text-white cursor-pointer">
                          <ImagePlus className="w-3.5 h-3.5" /> Add images
                          <input type="file" accept="image/*" multiple className="hidden" onChange={onPickReplyImages} disabled={replying || isChatLocked} />
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

                      <div className="flex items-center justify-between mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicketId("");
                            setSelectedTicket(null);
                            setReplyText("");
                            setReplyImages([]);
                          }}
                          className="text-xs text-gray-400 hover:text-gray-200 inline-flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handleReply}
                          disabled={replying || isChatLocked || (!replyText.trim() && replyImages.length === 0)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400 text-black text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-3.5 h-3.5" /> {replying ? "Sending..." : "Send Reply"}
                        </button>
                      </div>
                      {isChatLocked ? (
                        <p className="text-xs text-gray-500 mt-2">This ticket is resolved. Chat is read-only now.</p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
      </PageShell>
    </UserLayout>
  );
}
