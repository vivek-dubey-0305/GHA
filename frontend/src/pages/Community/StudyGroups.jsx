import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { BellDot, Clock3, Lock, Paperclip, Reply, Send, Users } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, EmptyState } from "../../components/DashboardPages/DashboardUI";
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
const EMOJIS = ["😀", "🔥", "👏", "❤️", "👍", "🎯", "💡", "🚀"];

const formatMuteCountdown = (mutedUntil) => {
  if (!mutedUntil) return "";
  const ms = Math.max(0, new Date(mutedUntil).getTime() - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const displayName = (sender) => {
  if (!sender) return "Learner";
  return [sender.firstName, sender.lastName].filter(Boolean).join(" ") || sender.name || "Learner";
};

export default function StudyGroups() {
  const socketRef = useRef(null);
  const joinedGroupRef = useRef("");
  const activeTabRef = useRef("groups");
  const messagesEndRef = useRef(null);
  const composerInputRef = useRef(null);
  const user = useSelector(selectUser);
  const actorId = user?._id || user?.id || "";

  const [activeTab, setActiveTab] = useState("groups");
  const [chatUnread, setChatUnread] = useState(false);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [messages, setMessages] = useState([]);
  const [composerText, setComposerText] = useState("");
  const [composerFiles, setComposerFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [mentionIds, setMentionIds] = useState([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [muteUntil, setMuteUntil] = useState(null);
  const [muteTimer, setMuteTimer] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  // Removal & Rejoin states
  const [removalReason, setRemovalReason] = useState("");
  const [isRemoved, setIsRemoved] = useState(false);
  const [showRejoinModal, setShowRejoinModal] = useState(false);
  const [rejoinReason, setRejoinReason] = useState("");
  const [rejoinLoading, setRejoinLoading] = useState(false);
  const [isPermanentlyBanned, setIsPermanentlyBanned] = useState(false);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group._id) === String(selectedGroupId)) || null,
    [groups, selectedGroupId]
  );

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

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/study-groups/my");
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      setGroups(rows);
      setSelectedGroupId((prev) => prev || rows[0]?._id || "");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load study groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!selectedGroupId) {
      setMessages([]);
      return;
    }

    try {
      const response = await apiClient.get(`/study-groups/${selectedGroupId}/messages?limit=80`);
      setMessages(Array.isArray(response?.data?.data?.messages) ? response.data.data.messages : []);
    } catch {
      setMessages([]);
    }
  }, [selectedGroupId]);

  const fetchMembers = useCallback(async () => {
    if (!selectedGroupId) {
      setMembers([]);
      return;
    }

    try {
      const response = await apiClient.get(`/study-groups/${selectedGroupId}/members`);
      setMembers(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch {
      setMembers([]);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchMessages();
    fetchMembers();
  }, [fetchMessages, fetchMembers]);

  useEffect(() => {
    const selected = groups.find((item) => String(item._id) === String(selectedGroupId));
    if (selected?.membership?.mutedUntil) {
      setMuteUntil(selected.membership.mutedUntil);
    } else {
      setMuteUntil(null);
    }

    if (selected?.membership?.status === "removed") {
      setIsRemoved(true);
      setRemovalReason(selected?.membership?.removalReason || "");
      setIsPermanentlyBanned(Boolean(selected?.membership?.finalWarning));
    } else {
      setIsRemoved(false);
      setRemovalReason("");
      setIsPermanentlyBanned(false);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!actorId) return;

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
      if (selectedGroupId) {
        socket.emit("join_study_group", { groupId: selectedGroupId, userId: actorId, role: "User" });
        joinedGroupRef.current = String(selectedGroupId);
      }
    });

    socket.on("study_group:new_message", ({ groupId, message }) => {
      if (String(groupId) !== String(selectedGroupId)) return;
      if (isRemoved) return;
      setMessages((prev) => {
        if (prev.some((item) => String(item?._id) === String(message?._id))) return prev;
        return [...prev, message];
      });
      if (activeTabRef.current !== "chat") setChatUnread(true);
    });

    socket.on("study_group:message_updated", ({ groupId, message }) => {
      if (String(groupId) !== String(selectedGroupId)) return;
      setMessages((prev) => prev.map((m) => (String(m._id) === String(message._id) ? message : m)));
    });

    socket.on("study_group:message_deleted", ({ groupId, message }) => {
      if (String(groupId) !== String(selectedGroupId)) return;
      setMessages((prev) => prev.map((m) => (String(m._id) === String(message._id) ? message : m)));
    });

    socket.on("study_group:member_muted", ({ groupId, userId, mutedUntil: nextMutedUntil }) => {
      if (String(groupId) !== String(selectedGroupId)) return;
      if (String(userId) !== String(actorId)) return;
      setMuteUntil(nextMutedUntil);
      setMuteTimer(formatMuteCountdown(nextMutedUntil));
    });

    socket.on("study_group:muted", ({ mutedUntil: nextMutedUntil }) => {
      setMuteUntil(nextMutedUntil);
      setMuteTimer(formatMuteCountdown(nextMutedUntil));
    });

    socket.on("study_group:error", ({ message }) => {
      setError(message || "Study group event failed");
    });

    socket.on("study_group:removed", ({ removalReason, permanentBan }) => {
      setIsRemoved(true);
      setRemovalReason(removalReason || "");
      setIsPermanentlyBanned(Boolean(permanentBan));
      setComposerText("");
      setComposerFiles([]);
      setReplyTo(null);
      setMentionIds([]);
      setShowMentionList(false);
      setError("You have been removed from this study group");
    });

    socket.on("study_group:rejoin_accepted", () => {
      setIsRemoved(false);
      setRemovalReason("");
      setIsPermanentlyBanned(false);
      setShowRejoinModal(false);
      setRejoinReason("");
      setError("You have been rejoined to the study group with a final warning. Any future removal will be permanent.");
    });

    socket.on("study_group:rejoin_rejected", () => {
      setShowRejoinModal(false);
      setRejoinReason("");
      setError("Your rejoin request was rejected by the instructor");
    });

    return () => {
      if (joinedGroupRef.current) {
        socket.emit("leave_study_group", { groupId: joinedGroupRef.current });
      }
      socket.disconnect();
    };
  }, [actorId, selectedGroupId, isRemoved]);

  useEffect(() => {
    if (!socketRef.current || !actorId || !selectedGroupId) return;

    if (joinedGroupRef.current && joinedGroupRef.current !== String(selectedGroupId)) {
      socketRef.current.emit("leave_study_group", { groupId: joinedGroupRef.current });
    }

    socketRef.current.emit("join_study_group", { groupId: selectedGroupId, userId: actorId, role: "User" });
    joinedGroupRef.current = String(selectedGroupId);
  }, [actorId, selectedGroupId]);

  useEffect(() => {
    if (activeTab === "chat") {
      setChatUnread(false);
    }
  }, [activeTab]);

  const mentionCandidates = useMemo(() => {
    const text = composerText || "";
    const atIndex = text.lastIndexOf("@");
    if (atIndex === -1) return [];

    const query = text.slice(atIndex + 1).trim().toLowerCase();
    if (!query) return members.slice(0, 6);

    return members
      .filter((member) => {
        const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.toLowerCase().trim();
        return fullName.includes(query);
      })
      .slice(0, 6);
  }, [composerText, members]);

  const pickMention = (member) => {
    const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.trim();
    const atIndex = composerText.lastIndexOf("@");
    if (atIndex === -1) return;
    const prefix = composerText.slice(0, atIndex);
    const nextText = `${prefix}@${fullName} `;
    setComposerText(nextText);
    setMentionIds((prev) => Array.from(new Set([...prev, String(member.user?._id)])));
    setShowMentionList(false);
  };

  const sendMessage = async () => {
    if (!selectedGroupId || (!composerText.trim() && composerFiles.length === 0) || isMuted || isRemoved) return;

    setSending(true);
    setError("");
    try {
      const formData = new FormData();
      if (composerText.trim()) formData.append("content", composerText.trim());
      if (replyTo?._id) formData.append("replyTo", replyTo._id);
      if (mentionIds.length > 0) formData.append("mentions", JSON.stringify(mentionIds));
      composerFiles.forEach((file) => formData.append("files", file));

      await apiClient.post(`/study-groups/${selectedGroupId}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setComposerText("");
      setComposerFiles([]);
      setReplyTo(null);
      setMentionIds([]);
      setShowMentionList(false);
      composerInputRef.current?.focus();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "chat") return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeTab, selectedGroupId]);

  const requestRejoin = async () => {
    if (isPermanentlyBanned) {
      setError("You are permanently banned from this group and cannot request rejoin.");
      return;
    }
    if (!selectedGroupId || !rejoinReason.trim()) return;
    setRejoinLoading(true);
    setError("");
    try {
      await apiClient.post(`/study-groups/${selectedGroupId}/request-rejoin`, {
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
  };

  const appendEmoji = (emoji) => {
    setComposerText((prev) => `${prev}${emoji}`);
  };

  const onFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    setComposerFiles(files.slice(0, 10));
  };

  return (
    <UserLayout>
      <PageShell
        title="Study Groups"
        subtitle="Collaborate with peers — solve problems, share notes, grow together."
      >
        {loading ? (
          <EmptyState icon={Users} title="Loading groups" subtitle="Fetching your course-based study groups..." />
        ) : groups.length === 0 ? (
          <EmptyState icon={Users} title="No study groups yet" subtitle="Enroll in a published course and your course group will appear here." />
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-800 bg-[#111] p-1.5 inline-flex gap-1">
              <button
                onClick={() => setActiveTab("groups")}
                className={`px-4 py-2 rounded-lg text-sm ${activeTab === "groups" ? "bg-white text-black" : "text-gray-300 hover:bg-gray-900"}`}
              >
                Groups
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 ${activeTab === "chat" ? "bg-white text-black" : "text-gray-300 hover:bg-gray-900"}`}
              >
                Chat
                {chatUnread ? <BellDot className="h-4 w-4 text-red-500" /> : null}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">
              <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
                <div className="mb-3 text-sm text-gray-300">Your Groups</div>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {groups.map((group) => {
                    const active = String(group._id) === String(selectedGroupId);
                    const groupRemoved = group?.membership?.status === "removed";
                    return (
                      <button
                        key={group._id}
                        onClick={() => setSelectedGroupId(group._id)}
                        className={`w-full rounded-lg border px-3 py-3 text-left transition ${active ? "border-white/60 bg-white/10" : "border-gray-800 hover:border-gray-700"} ${groupRemoved ? "opacity-75" : "opacity-100"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-white line-clamp-1">{group.name}</div>
                          {groupRemoved ? (
                            <span className="inline-flex items-center gap-1 rounded border border-yellow-600/50 bg-yellow-900/20 px-1.5 py-0.5 text-[10px] text-yellow-300">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 line-clamp-1">{group.course?.title || "Course"}</div>
                        <div className="mt-2 text-[11px] text-gray-400">{group.memberCount || 0} members</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTab === "groups" ? (
                <div className="rounded-xl border border-gray-800 bg-[#111] p-5">
                  {!selectedGroup ? (
                    <p className="text-sm text-gray-500">Select a group to view details.</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center text-xs text-gray-400">
                          {selectedGroup.profilePhoto?.secure_url ? (
                            <img src={selectedGroup.profilePhoto.secure_url} alt="Group" className="h-full w-full object-cover" />
                          ) : (
                            (selectedGroup.name || "G").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{selectedGroup.name}</h3>
                          <p className="text-xs text-gray-500">{selectedGroup.course?.title || "Course"}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Description</div>
                          <p className="text-sm text-gray-300">{selectedGroup.description || "No description available."}</p>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Rules & Instructions</div>
                          {Array.isArray(selectedGroup.instructions) && selectedGroup.instructions.length > 0 ? (
                            <ul className="space-y-1 text-sm text-gray-300 list-disc pl-5">
                              {selectedGroup.instructions.map((line, idx) => (
                                <li key={`${selectedGroup._id}-rule-${idx}`}>{line}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-400">No instructions available.</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className={`rounded-xl border border-gray-800 bg-[#111] overflow-hidden transition ${isRemoved ? "opacity-80" : "opacity-100"}`}>
                  {!selectedGroup ? (
                    <div className="p-5 text-sm text-gray-500">Select a group from Groups tab to open chat.</div>
                  ) : (
                    <>
                      <div className="border-b border-gray-800 p-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-white font-semibold">{selectedGroup.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{selectedGroup.course?.title || "Course chat"}</p>
                        </div>
                        {isRemoved ? (
                          <div className="inline-flex items-center gap-1 rounded-md border border-yellow-600/50 bg-yellow-900/20 px-2 py-1 text-[11px] text-yellow-300">
                            <Lock className="h-3 w-3" /> Read only
                          </div>
                        ) : null}
                      </div>

                      <div className="h-[52vh] overflow-y-auto p-4 space-y-2 bg-[#0c0c0c]">
                        {messages.length === 0 ? (
                          <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
                        ) : (
                          messages.map((message) => {
                            const mine = String(message?.sender?._id || message?.sender) === String(actorId);
                            return (
                              <div key={message._id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm border ${mine ? "ml-auto bg-yellow-400/20 border-yellow-500/40" : "bg-[#161616] border-gray-800"}`}>
                                <div className="text-[11px] text-gray-400 mb-1">{displayName(message.sender)}</div>
                                {message.replyTo?.content ? (
                                  <div className="mb-1 rounded-lg bg-black/30 border border-gray-800 px-2 py-1 text-xs text-gray-400">Reply: {message.replyTo.content}</div>
                                ) : null}
                                <div className="text-gray-100 whitespace-pre-wrap">{message.content || "[Attachment]"}</div>
                                {Array.isArray(message.attachments) && message.attachments.length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {message.attachments.map((file, idx) => (
                                      <a key={`${message._id}-${idx}`} href={file.url} target="_blank" rel="noreferrer" className="text-xs underline text-yellow-300">
                                        {file.fileName}
                                      </a>
                                    ))}
                                  </div>
                                ) : null}
                                {!isRemoved ? (
                                  <div className="mt-2">
                                    <button onClick={() => setReplyTo(message)} className="text-[11px] text-gray-500 hover:text-gray-200 inline-flex items-center gap-1">
                                      <Reply className="h-3 w-3" /> Reply
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      <div className="border-t border-gray-800 p-3 space-y-2">
                        {isRemoved ? (
                          <>
                            <div className="rounded-lg border border-red-600/60 bg-linear-to-r from-yellow-900/40 to-red-900/40 px-3 py-3 text-sm text-gray-100">
                              <div className="font-semibold text-red-300 mb-2">⛔ You have been removed from this study group</div>
                              {removalReason && (
                                <div className="text-xs text-gray-300 mb-2 italic">
                                  <span className="font-semibold text-orange-300">Reason:</span> {removalReason}
                                </div>
                              )}
                              {isPermanentlyBanned ? (
                                <div className="inline-flex items-center gap-2 rounded-lg border border-red-700/60 bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-300">
                                  Permanently banned from rejoining
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowRejoinModal(true)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Request to Rejoin
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            {isMuted ? (
                              <div className="rounded-lg border border-orange-600/40 bg-orange-950/30 px-3 py-2 text-xs text-orange-200 inline-flex items-center gap-2">
                                <Clock3 className="h-3.5 w-3.5" /> You are blocked from sending messages. Please wait for ice break ({muteTimer || "00:00"}).
                              </div>
                            ) : null}
                          </>
                        )}

                        {replyTo ? (
                          <div className="rounded-lg border border-gray-700 bg-black/30 px-3 py-2 text-xs text-gray-300 flex items-center justify-between">
                            <span>Replying to: {replyTo.content || "[Attachment]"}</span>
                            <button className="text-gray-400 hover:text-white" onClick={() => setReplyTo(null)}>Cancel</button>
                          </div>
                        ) : null}

                        {!isRemoved && (
                          <>
                            <div className="flex flex-wrap gap-1">
                              {EMOJIS.map((emoji) => (
                                <button key={emoji} onClick={() => appendEmoji(emoji)} className="rounded border border-gray-700 bg-black/30 px-2 py-1 text-sm">{emoji}</button>
                              ))}
                            </div>

                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-gray-700 p-2 text-gray-300 hover:bg-gray-900">
                            <Paperclip className="h-4 w-4" />
                            <input type="file" multiple className="hidden" onChange={onFileSelect} />
                          </label>
                          <input
                            ref={composerInputRef}
                            value={composerText}
                            onChange={(e) => {
                              setComposerText(e.target.value);
                              setShowMentionList(e.target.value.includes("@"));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            placeholder="Type message... use @ to mention"
                            disabled={isMuted || isRemoved}
                            className="flex-1 rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm text-gray-100 disabled:opacity-60"
                          />
                          <button onClick={sendMessage} disabled={sending || isMuted || isRemoved} className="inline-flex items-center gap-1 rounded-xl bg-yellow-400 px-3 py-2 text-sm font-semibold text-black disabled:opacity-50">
                            <Send className="h-4 w-4" /> Send
                          </button>
                        </div>

                        {showMentionList && mentionCandidates.length > 0 ? (
                          <div className="rounded-lg border border-gray-700 bg-[#0d0d0d] p-2 max-h-32 overflow-y-auto">
                            {mentionCandidates.map((member) => {
                              const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.trim();
                              return (
                                <button key={member._id} onClick={() => pickMention(member)} className="w-full text-left px-2 py-1 rounded text-sm text-gray-200 hover:bg-gray-800">
                                  @{fullName}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}

                        {composerFiles.length > 0 ? (
                          <div className="rounded-lg border border-gray-700 bg-black/30 px-3 py-2 text-xs text-gray-300 inline-flex items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5" /> {composerFiles.length} file(s) selected
                          </div>
                        ) : null}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejoin Request Modal */}
        {showRejoinModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#111] border border-blue-600/50 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Request to Rejoin Study Group</h3>
              <p className="text-sm text-gray-400 mb-4">
                Explain why you believe you should be allowed to rejoin this study group.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-300 mb-2">Your Request (Required)</label>
                <textarea
                  value={rejoinReason}
                  onChange={(e) => setRejoinReason(e.target.value)}
                  placeholder="Tell the instructor why you should be allowed back..."
                  maxLength={500}
                  rows={4}
                  className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">{rejoinReason.length}/500</div>
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
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rejoinLoading ? "Submitting..." : "Request to Rejoin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-700/50 bg-red-950/30 px-4 py-2 text-sm text-red-300">{error}</div>
        ) : null}
      </PageShell>
    </UserLayout>
  );
}
