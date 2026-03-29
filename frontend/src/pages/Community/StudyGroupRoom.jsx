import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { ArrowLeft, Clock3, Lock, Send, Users } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell } from "../../components/DashboardPages/DashboardUI";
import { selectUser } from "../../redux/slices/auth.slice";
import { apiClient } from "../../utils/api.utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const SOCKET_URL = (() => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  try {
    const url = new URL(API_BASE_URL);
    console.log("Derived SOCKET_URL from API_BASE_URL:", `${url.protocol}//${url.host}`);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:5000";
  }
})();

const formatMuteCountdown = (mutedUntil) => {
  if (!mutedUntil) return "";
  const ms = Math.max(0, new Date(mutedUntil).getTime() - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

export default function StudyGroupRoom() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const user = useSelector(selectUser);

  const socketRef = useRef(null);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [muteUntil, setMuteUntil] = useState(null);
  const [muteTimer, setMuteTimer] = useState("");
  const [isRemoved, setIsRemoved] = useState(false);
  const [removalReason, setRemovalReason] = useState("");
  const [showRejoinModal, setShowRejoinModal] = useState(false);
  const [rejoinReason, setRejoinReason] = useState("");
  const [rejoinLoading, setRejoinLoading] = useState(false);
  const [isPermanentlyBanned, setIsPermanentlyBanned] = useState(false);

  const actor = useMemo(() => ({
    id: user?._id || user?.id || "",
    role: "User",
    name: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Student",
  }), [user]);

  const isMuted = useMemo(() => {
    if (!muteUntil) return false;
    return new Date(muteUntil).getTime() > Date.now();
  }, [muteUntil]);

  useEffect(() => {
    if (!muteUntil) {
      setMuteTimer("");
      return;
    }

    const timer = setInterval(() => {
      const next = formatMuteCountdown(muteUntil);
      setMuteTimer(next);
      if (!next || next === "00:00") {
        setMuteUntil(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [muteUntil]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [groupRes, msgRes] = await Promise.all([
        apiClient.get(`/study-groups/${groupId}`),
        apiClient.get(`/study-groups/${groupId}/messages?limit=50`),
      ]);

      const groupData = groupRes?.data?.data || null;
      const messageRows = msgRes?.data?.data?.messages || [];
      setGroup(groupData);
      setMessages(Array.isArray(messageRows) ? messageRows : []);

      const mutedUntil = groupData?.membership?.mutedUntil || null;
      setMuteUntil(mutedUntil);
      if (mutedUntil) {
        setMuteTimer(formatMuteCountdown(mutedUntil));
      }

      if (groupData?.membership?.status === "removed") {
        setIsRemoved(true);
        setRemovalReason(groupData?.membership?.removalReason || "");
        setIsPermanentlyBanned(Boolean(groupData?.membership?.finalWarning));
      } else {
        setIsRemoved(false);
        setRemovalReason("");
        setIsPermanentlyBanned(false);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load study group room");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId || !actor.id) return;

    loadInitialData();

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 800,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_study_group", {
        groupId,
        userId: actor.id,
        role: actor.role,
      });
    });

    socket.on("study_group:new_message", ({ message, groupId: incomingGroupId }) => {
      if (String(incomingGroupId) !== String(groupId)) return;
      if (isRemoved) return;
      setMessages((prev) => [...prev, message]);
    });

    socket.on("study_group:message_updated", ({ message, groupId: incomingGroupId }) => {
      if (String(incomingGroupId) !== String(groupId)) return;
      setMessages((prev) => prev.map((m) => (String(m._id) === String(message._id) ? message : m)));
    });

    socket.on("study_group:message_deleted", ({ message, groupId: incomingGroupId }) => {
      if (String(incomingGroupId) !== String(groupId)) return;
      setMessages((prev) => prev.map((m) => (String(m._id) === String(message._id) ? message : m)));
    });

    socket.on("study_group:member_muted", ({ userId, mutedUntil, groupId: incomingGroupId }) => {
      if (String(incomingGroupId) !== String(groupId)) return;
      if (String(userId) !== String(actor.id)) return;
      setMuteUntil(mutedUntil);
      setMuteTimer(formatMuteCountdown(mutedUntil));
    });

    socket.on("study_group:muted", ({ mutedUntil }) => {
      setMuteUntil(mutedUntil);
      setMuteTimer(formatMuteCountdown(mutedUntil));
    });

    socket.on("study_group:error", ({ message }) => {
      setError(message || "Study group event failed");
    });

    socket.on("study_group:removed", ({ removalReason: reason, permanentBan }) => {
      setIsRemoved(true);
      setRemovalReason(reason || "");
      setIsPermanentlyBanned(Boolean(permanentBan));
      setContent("");
      setError("You have been removed from this study group");
    });

    socket.on("study_group:rejoin_accepted", () => {
      setIsRemoved(false);
      setRemovalReason("");
      setIsPermanentlyBanned(false);
      setShowRejoinModal(false);
      setRejoinReason("");
      setError("You have been rejoined to the study group with a final warning.");
      loadInitialData();
    });

    socket.on("study_group:rejoin_rejected", () => {
      setShowRejoinModal(false);
      setRejoinReason("");
      setError("Your rejoin request was rejected by the instructor");
    });

    return () => {
      socket.emit("leave_study_group", { groupId });
      socket.disconnect();
    };
  }, [actor.id, actor.role, groupId, loadInitialData, isRemoved]);

  const sendMessage = useCallback(async () => {
    const clean = content.trim();
    if (!clean || sending || isMuted || isRemoved) return;

    setSending(true);
    setError("");
    try {
      await apiClient.post(`/study-groups/${groupId}/messages`, {
        content: clean,
      });
      setContent("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }, [content, groupId, isMuted, sending, isRemoved]);

  const requestRejoin = useCallback(async () => {
    if (!groupId || !rejoinReason.trim()) return;
    if (isPermanentlyBanned) {
      setError("You are permanently banned from this group and cannot request rejoin.");
      return;
    }

    setRejoinLoading(true);
    setError("");
    try {
      await apiClient.post(`/study-groups/${groupId}/request-rejoin`, {
        rejoinRequestReason: rejoinReason,
      });
      setShowRejoinModal(false);
      setRejoinReason("");
      setError("Rejoin request submitted. The instructor will review your request.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit rejoin request");
    } finally {
      setRejoinLoading(false);
    }
  }, [groupId, rejoinReason, isPermanentlyBanned]);

  return (
    <UserLayout>
      <PageShell
        title={group?.name || "Study Group"}
        subtitle={group?.course?.title || "Realtime course group"}
        actions={
          <button
            onClick={() => navigate("/dashboard/study-groups")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      >
        {loading ? (
          <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-5 text-sm text-gray-400">Loading study group...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-700/50 bg-red-950/40 p-5 text-sm text-red-300">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <div className={`rounded-xl border border-gray-800 bg-[#111] overflow-hidden transition ${isRemoved ? "opacity-80" : "opacity-100"}`}>
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
                ) : (
                  messages.map((message) => {
                    const mine = String(message?.sender?._id || message?.sender) === String(actor.id);
                    const senderName = message?.senderName || message?.sender?.firstName || message?.sender?.name || (mine ? "You" : "Learner");
                    return (
                      <div key={message._id || `${message.createdAt}-${message.content}`} className={`rounded-xl px-3 py-2 text-sm ${mine ? "bg-yellow-400/20 border border-yellow-500/40" : "bg-gray-900 border border-gray-800"}`}>
                        <div className="mb-1 text-xs text-gray-400">{senderName}</div>
                        <p className="whitespace-pre-wrap text-gray-100">{message.content}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-gray-800 p-3">
                {isRemoved ? (
                  <div className="mb-2 rounded-lg border border-red-600/60 bg-linear-to-r from-yellow-900/40 to-red-900/40 px-3 py-3 text-sm text-gray-100">
                    <div className="mb-2 inline-flex items-center gap-2 font-semibold text-red-300">
                      <Lock className="h-4 w-4" /> You were removed from this group
                    </div>
                    {removalReason ? (
                      <div className="mb-2 text-xs text-gray-300 italic">
                        <span className="font-semibold text-orange-300">Reason:</span> {removalReason}
                      </div>
                    ) : null}
                    {isPermanentlyBanned ? (
                      <div className="inline-flex items-center rounded-md border border-red-700/60 bg-red-900/30 px-2 py-1 text-xs text-red-300">
                        Permanently banned from rejoining
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRejoinModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Request to Rejoin
                      </button>
                    )}
                  </div>
                ) : null}

                {isMuted ? (
                  <div className="mb-2 rounded-lg border border-orange-600/40 bg-orange-950/30 px-3 py-2 text-xs text-orange-200">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>You are blocked from sending messages. Please wait for ice break ({muteTimer || "00:00"}).</span>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message, mention with @name..."
                    disabled={isMuted || isRemoved}
                    className="flex-1 rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm text-gray-100 outline-none focus:border-yellow-400/60 disabled:opacity-60"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !content.trim() || isMuted || isRemoved}
                    className="inline-flex items-center gap-1 rounded-xl bg-yellow-400 px-3 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> Send
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-100">
                <Users className="h-4 w-4" /> Group Info
              </div>
              <p className="text-sm text-gray-400">{group?.description || "No description yet."}</p>
              <div className="mt-4 rounded-lg border border-gray-800 bg-[#0f0f0f] p-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">Instructions</div>
                <p className="mt-1 text-sm text-gray-300 whitespace-pre-wrap">{group?.instructions || "No instructions yet."}</p>
              </div>
            </div>
          </div>
        )}

        {showRejoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="mx-4 w-full max-w-md rounded-lg border border-blue-600/50 bg-[#111] p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">Request to Rejoin Study Group</h3>
              <p className="mb-4 text-sm text-gray-400">Explain why you should be allowed to rejoin this study group.</p>

              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium text-gray-300">Your Request (Required)</label>
                <textarea
                  value={rejoinReason}
                  onChange={(e) => setRejoinReason(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell the instructor why you should be allowed back..."
                  className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <div className="mt-1 text-xs text-gray-500">{rejoinReason.length}/500</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejoinModal(false);
                    setRejoinReason("");
                  }}
                  disabled={rejoinLoading}
                  className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={requestRejoin}
                  disabled={rejoinLoading || !rejoinReason.trim()}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {rejoinLoading ? "Submitting..." : "Request to Rejoin"}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
