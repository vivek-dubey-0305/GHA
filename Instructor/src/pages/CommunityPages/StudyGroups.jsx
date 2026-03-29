import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  BellDot,
  Clock3,
  ImagePlus,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Reply,
  Save,
  Send,
  ShieldBan,
  Users,
  UserX,
  Plus,
  Trash2,
  Loader,
  SearchIcon,
  ChevronDown,
} from "lucide-react";
import { InstructorLayout } from "../../components/layout/InstructorLayout";
import { apiClient } from "../../utils/api.utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const SOCKET_URL = (() => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:5000";
  }
})();

const EMOJIS = ["😀", "🔥", "👏", "❤️", "👍", "🎯", "💡", "🚀"];

const buildSenderName = (sender) => {
  if (!sender) return "Instructor";
  return [sender.firstName, sender.lastName].filter(Boolean).join(" ") || sender.name || "Instructor";
};

const normalizeInstructions = (value) => {
  if (Array.isArray(value)) {
    const clean = value.map((line) => String(line || "").trim()).filter(Boolean);
    return clean.length ? clean : [];
  }
  if (typeof value === "string") {
    const clean = value.split("\n").map((line) => line.trim()).filter(Boolean);
    return clean.length ? clean : [];
  }
  return [];
};

// Modal Component for Adding Members
function AddMemberModal({ isOpen, onClose, onSubmit, loading, nonJoinedMembers, searchQuery, setSearchQuery }) {
  const [selectedUserId, setSelectedUserId] = useState("");

  if (!isOpen) return null;

  const filtered = nonJoinedMembers.filter((member) => {
    const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.toLowerCase();
    const email = (member.user?.email || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  const handleSubmit = () => {
    if (selectedUserId) {
      onSubmit(selectedUserId);
      setSelectedUserId("");
      setSearchQuery("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-gray-800 rounded-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Add Member to Group</h2>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <SearchIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-800 rounded-lg bg-black/20 p-2">
          {filtered.length === 0 ? (
            <div className="text-xs text-gray-500 p-2">No available members</div>
          ) : (
            filtered.map((member) => {
              const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.trim();
              return (
                <button
                  key={member._id}
                  onClick={() => setSelectedUserId(member.user._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedUserId === member.user._id
                      ? "bg-white/20 border border-white/40"
                      : "border border-gray-800 hover:border-gray-600"
                  }`}
                >
                  <div className="font-medium text-gray-200">{fullName}</div>
                  <div className="text-xs text-gray-500">{member.user?.email}</div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-800 text-gray-300 hover:bg-gray-900 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedUserId || loading}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Searchable Member Dropdown Component
function MemberSelector({ members, selectedUserId, onSelect, isOpen, onToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  const filtered = members.filter((member) => {
    const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.toLowerCase();
    const email = (member.user?.email || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  const selected = members.find((m) => String(m.user?._id) === String(selectedUserId));
  const selectedLabel = selected
    ? `${selected.user?.firstName || ""} ${selected.user?.lastName || ""}`.trim()
    : "Select member...";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        if (isOpen) onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white text-left flex items-center justify-between hover:border-gray-600"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-gray-800 rounded-lg z-40 shadow-lg">
          <div className="p-2 border-b border-gray-800">
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-black/40 px-2 py-1.5 text-xs text-white"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-gray-500">No members found</div>
            ) : (
              filtered.map((member) => {
                const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.trim();
                const isSelected = String(member.user?._id) === String(selectedUserId);
                return (
                  <button
                    key={member._id}
                    onClick={() => {
                      onSelect(member.user._id);
                      setSearchQuery("");
                      onToggle();
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition ${
                      isSelected ? "bg-white/20" : "hover:bg-gray-900"
                    }`}
                  >
                    <div className="font-medium text-gray-200">{fullName}</div>
                    <div className="text-gray-500">{member.user?.email}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Removal Reason Modal - Instructor removes member
function RemovalReasonModal({
  isOpen,
  onClose,
  onSubmit,
  targetMemberName,
  loading,
  removalReason,
  setRemovalReason,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#111] border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Remove Member</h3>
        <p className="text-sm text-gray-400 mb-4">
          You are about to remove <span className="font-medium text-gray-200">{targetMemberName}</span> from this study group.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-300 mb-2">Removal Reason (Required)</label>
          <textarea
            value={removalReason}
            onChange={(e) => setRemovalReason(e.target.value)}
            placeholder="Why are you removing this member?"
            maxLength={500}
            rows={4}
            className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <div className="text-xs text-gray-500 mt-1">{removalReason.length}/500</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(removalReason)}
            disabled={loading || !removalReason.trim()}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Remove Member
          </button>
        </div>
      </div>
    </div>
  );
}

// Final Warning Modal - Instructor accepts rejoin with warning
function FinalWarningModal({
  isOpen,
  onClose,
  onAccept,
  memberName,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#111] border border-yellow-600/50 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-2xl">⚠️</div>
          <h3 className="text-lg font-semibold text-yellow-400">Final Warning</h3>
        </div>

        <p className="text-sm text-gray-300 mb-4">
          You are about to rejoin <span className="font-medium text-gray-200">{memberName}</span> to this study group with a <span className="font-bold text-red-400">final warning</span>.
        </p>

        <p className="text-sm text-orange-300 mb-4 p-3 bg-orange-900/30 rounded-lg border border-orange-700/50">
          If this member is removed again, they will <span className="font-bold">NOT</span> be allowed to rejoin automatically.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Accept & Rejoin
          </button>
        </div>
      </div>
    </div>
  );
}

// Rejoin Request Modal - User requests to rejoin after removal
function RejoinRequestModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  rejoinRequestReason,
  setRejoinRequestReason,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#111] border border-blue-600/50 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Request to Rejoin</h3>
        <p className="text-sm text-gray-400 mb-4">
          Explain why you believe you should be allowed to rejoin this study group.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-300 mb-2">Your Request (Required)</label>
          <textarea
            value={rejoinRequestReason}
            onChange={(e) => setRejoinRequestReason(e.target.value)}
            placeholder="Tell the instructor why you should be allowed back..."
            maxLength={500}
            rows={4}
            className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <div className="text-xs text-gray-500 mt-1">{rejoinRequestReason.length}/500</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(rejoinRequestReason)}
            disabled={loading || !rejoinRequestReason.trim()}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Request to Rejoin
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudyGroups() {
  const socketRef = useRef(null);
  const joinedGroupRef = useRef("");
  const activeTabRef = useRef("groups");

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ name: "", description: "", instructions: [] });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [muteMinutes, setMuteMinutes] = useState(10);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [nonJoinedMembers, setNonJoinedMembers] = useState([]);
  const [searchNonJoined, setSearchNonJoined] = useState("");
  // Removal/Rejoin states
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [removalTargetUserId, setRemovalTargetUserId] = useState("");
  const [removalTargetMemberName, setRemovalTargetMemberName] = useState("");
  const [removalReason, setRemovalReason] = useState("");
  const [removalReasonLoading, setRemovalReasonLoading] = useState(false);
  const [showRejoinRequestModal, setShowRejoinRequestModal] = useState(false);
  const [rejoinRequestReason, setRejoinRequestReason] = useState("");
  const [rejoinRequests, setRejoinRequests] = useState([]); // For instructor view
  const [showFinalWarningModal, setShowFinalWarningModal] = useState(false);
  const [finalWarningUserId, setFinalWarningUserId] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group._id) === String(selectedGroupId)) || null,
    [groups, selectedGroupId]
  );

  const selectedMember = useMemo(
    () => members.find((m) => String(m.user?._id) === String(selectedMemberId)) || null,
    [members, selectedMemberId]
  );

  const finalWarningMember = useMemo(
    () => rejoinRequests.find((r) => String(r.user?._id) === String(finalWarningUserId)) || null,
    [rejoinRequests, finalWarningUserId]
  );

  // Filter to show only muted or removed members
  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        const isMuted = member.mutedUntil && new Date(member.mutedUntil).getTime() > Date.now();
        const isRemoved = member.status === "removed";
        return isMuted || isRemoved;
      }),
    [members]
  );

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/study-groups/instructor/my");
      const rows = response?.data?.data || [];
      setGroups(Array.isArray(rows) ? rows : []);

      if (!selectedGroupId && rows.length > 0) {
        setSelectedGroupId(rows[0]._id);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load study groups");
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId]);

  const fetchMembers = useCallback(async () => {
    if (!selectedGroupId) {
      setMembers([]);
      return;
    }

    try {
      const response = await apiClient.get(`/study-groups/instructor/${selectedGroupId}/members`);
      setMembers(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch {
      setMembers([]);
    }
  }, [selectedGroupId]);

  const fetchMessages = useCallback(async () => {
    if (!selectedGroupId) {
      setMessages([]);
      return;
    }

    try {
      const response = await apiClient.get(`/study-groups/instructor/${selectedGroupId}/messages?limit=20`);
      setMessages(response?.data?.data?.messages || []);
    } catch {
      setMessages([]);
    }
  }, [selectedGroupId]);

  const fetchNonJoinedMembers = useCallback(async () => {
    if (!selectedGroupId) {
      setNonJoinedMembers([]);
      return;
    }

    try {
      const response = await apiClient.get(`/study-groups/instructor/${selectedGroupId}/non-joined-members`);
      setNonJoinedMembers(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch {
      setNonJoinedMembers([]);
    }
  }, [selectedGroupId]);

  const fetchRejoinRequests = useCallback(async () => {
    if (!selectedGroupId) return;
    try {
      const response = await apiClient.get(`/study-groups/instructor/${selectedGroupId}/rejoin-requests`);
      setRejoinRequests(response?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch rejoin requests", err);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (!selectedGroup) return;
    setSettings({
      name: selectedGroup.name || "",
      description: selectedGroup.description || "",
      instructions: normalizeInstructions(selectedGroup.instructions),
    });
  }, [selectedGroup]);

  useEffect(() => {
    fetchMessages();
    fetchMembers();
    fetchNonJoinedMembers();
    fetchRejoinRequests();
  }, [fetchMessages, fetchMembers, fetchNonJoinedMembers, fetchRejoinRequests]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
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
        socket.emit("join_study_group", {
          groupId: selectedGroupId,
          userId: "instructor",
          role: "Instructor",
        });
        joinedGroupRef.current = String(selectedGroupId);
      }
    });

    socket.on("study_group:new_message", ({ groupId, message }) => {
      if (String(groupId) !== String(selectedGroupId)) return;
      setMessages((prev) => [...prev, message]);
      if (activeTabRef.current !== "chat") {
        setChatUnread(true);
      }
    });

    socket.on("study_group:message_updated", ({ groupId, message }) => {
      if (String(groupId) !== String(selectedGroupId)) return;
      setMessages((prev) => prev.map((m) => (String(m._id) === String(message._id) ? message : m)));
    });

    socket.on("study_group:message_deleted", ({ groupId, message }) => {
      if (String(groupId) !== String(selectedGroupId)) return;
      setMessages((prev) => prev.map((m) => (String(m._id) === String(message._id) ? message : m)));
    });

    socket.on("study_group:settings_updated", ({ groupId, group }) => {
      setGroups((prev) => prev.map((item) => (String(item._id) === String(groupId) ? group : item)));
    });

    socket.on("study_group:member_muted", () => {
      fetchMembers();
    });

    socket.on("study_group:member_unmuted", () => {
      fetchMembers();
    });

    socket.on("study_group:member_added", () => {
      fetchMembers();
      fetchNonJoinedMembers();
    });

    socket.on("study_group:member_removed", () => {
      fetchMembers();
      fetchRejoinRequests();
    });

    socket.on("study_group:rejoin_requested", () => {
      fetchRejoinRequests();
    });

    socket.on("study_group:member_rejoined", () => {
      fetchMembers();
      fetchRejoinRequests();
    });

    return () => {
      if (joinedGroupRef.current) {
        socket.emit("leave_study_group", { groupId: joinedGroupRef.current });
      }
      socket.disconnect();
    };
  }, [selectedGroupId, fetchMembers, fetchNonJoinedMembers, fetchRejoinRequests]);

  useEffect(() => {
    if (!socketRef.current || !selectedGroupId || !socketRef.current.connected) return;

    if (joinedGroupRef.current && joinedGroupRef.current !== String(selectedGroupId)) {
      socketRef.current.emit("leave_study_group", { groupId: joinedGroupRef.current });
    }

    socketRef.current.emit("join_study_group", {
      groupId: selectedGroupId,
      userId: "instructor",
      role: "Instructor",
    });
    joinedGroupRef.current = String(selectedGroupId);
  }, [selectedGroupId]);

  useEffect(() => {
    if (activeTab === "chat") {
      setChatUnread(false);
    }
  }, [activeTab]);

  const saveSettings = async () => {
    if (!selectedGroupId) return;
    setSaving(true);
    setError("");
    try {
      await apiClient.patch(`/study-groups/instructor/${selectedGroupId}/settings`, {
        ...settings,
        instructions: settings.instructions.filter((line) => line.trim()),
      });
      await fetchGroups();
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update group settings");
    } finally {
      setSaving(false);
    }
  };

  const addInstruction = () => {
    setSettings((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ""],
    }));
  };

  const updateInstruction = (idx, value) => {
    const next = [...settings.instructions];
    next[idx] = value;
    setSettings((prev) => ({ ...prev, instructions: next }));
  };

  const removeInstruction = (idx) => {
    setSettings((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== idx),
    }));
  };

  const muteMember = async (targetUserId) => {
    if (!selectedGroupId || !targetUserId) return;
    setSaving(true);
    setError("");
    try {
      await apiClient.patch(`/study-groups/instructor/${selectedGroupId}/members/${targetUserId}/mute`, {
        durationMinutes: Number(muteMinutes) || 1,
        reason: "Please wait for ice break",
      });
      setSelectedMemberId("");
      await fetchMembers();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to mute member");
    } finally {
      setSaving(false);
    }
  };

  const unmuteMember = async (targetUserId) => {
    if (!selectedGroupId || !targetUserId) return;
    setSaving(true);
    setError("");
    try {
      await apiClient.patch(`/study-groups/instructor/${selectedGroupId}/members/${targetUserId}/unmute`);
      await fetchMembers();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to unmute member");
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (userId) => {
    if (!selectedGroupId || !userId) return;
    setSaving(true);
    setError("");
    try {
      await apiClient.post(`/study-groups/instructor/${selectedGroupId}/members/add`, { userId });
      setShowAddMemberModal(false);
      setSearchNonJoined("");
      await fetchMembers();
      await fetchNonJoinedMembers();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (userId, reason) => {
    if (!selectedGroupId || !userId) return;
    setRemovalReasonLoading(true);
    setError("");
    try {
      await apiClient.patch(`/study-groups/instructor/${selectedGroupId}/members/${userId}/remove`, {
        removalReason: reason,
      });
      setShowRemovalModal(false);
      setRemovalReason("");
      setRemovalTargetUserId("");
      setRemovalTargetMemberName("");
      setSelectedMemberId("");
      await fetchMembers();
      await fetchRejoinRequests();
      await fetchNonJoinedMembers();
    } catch (err) {
      setShowRemovalModal(false);
      setRemovalReason("");
      setRemovalTargetUserId("");
      setRemovalTargetMemberName("");
      setError(err?.response?.data?.message || "Failed to remove member");
    } finally {
      setRemovalReasonLoading(false);
    }
  };

  const acceptRejoinRequest = async (userId) => {
    if (!selectedGroupId || !userId) return;
    setShowFinalWarningModal(false);
    setSaving(true);
    setError("");
    try {
      await apiClient.patch(`/study-groups/instructor/${selectedGroupId}/rejoin-requests/${userId}/accept`);
      await fetchMembers();
      await fetchRejoinRequests();
      await fetchNonJoinedMembers();
      setFinalWarningUserId("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to accept rejoin request");
    } finally {
      setSaving(false);
    }
  };

  const rejectRejoinRequest = async (userId) => {
    if (!selectedGroupId || !userId) return;
    setSaving(true);
    setError("");
    try {
      await apiClient.patch(`/study-groups/instructor/${selectedGroupId}/rejoin-requests/${userId}/reject`);
      await fetchRejoinRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reject rejoin request");
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedGroupId || (!composerText.trim() && composerFiles.length === 0)) return;
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      if (composerText.trim()) formData.append("content", composerText.trim());
      if (replyTo?._id) formData.append("replyTo", replyTo._id);
      if (mentionIds.length > 0) formData.append("mentions", JSON.stringify(mentionIds));
      composerFiles.forEach((file) => formData.append("files", file));

      await apiClient.post(`/study-groups/instructor/${selectedGroupId}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setComposerText("");
      setComposerFiles([]);
      setReplyTo(null);
      setMentionIds([]);
      setShowMentionList(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSaving(false);
    }
  };

  const appendEmoji = (emoji) => {
    setComposerText((prev) => `${prev}${emoji}`);
  };

  const onFileSelect = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    setComposerFiles(nextFiles.slice(0, 10));
  };

  const onProfilePhotoSelect = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file || !selectedGroupId) return;

    setUploadingPhoto(true);
    setError("");
    try {
      const imageForm = new FormData();
      imageForm.append("profilePhoto", file);
      await apiClient.patch(`/study-groups/instructor/${selectedGroupId}/profile-photo`, imageForm, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchGroups();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to upload profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

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

  const recentMessages = useMemo(() => messages.slice(-5), [messages]);

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Course Study Groups</h1>
            </div>
            <p className="text-gray-500 mt-1">Manage group settings, members, and facilitate collaborative discussions.</p>
          </div>
          <button
            onClick={fetchGroups}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-4 py-2 text-sm text-gray-200 hover:border-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-700/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : null}

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

        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
          <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-300">
              <Users className="h-4 w-4" /> Your Groups
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {groups.length === 0 ? (
                <div className="text-sm text-gray-500">No published course groups yet.</div>
              ) : (
                groups.map((group) => {
                  const active = String(group._id) === String(selectedGroupId);
                  return (
                    <button
                      key={group._id}
                      onClick={() => setSelectedGroupId(group._id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${active ? "border-white/60 bg-white/10" : "border-gray-800 hover:border-gray-700"}`}
                    >
                      <div className="text-sm font-semibold text-white line-clamp-1">{group.name}</div>
                      <div className="mt-1 text-xs text-gray-500 line-clamp-1">{group.course?.title || "Course"}</div>
                      <div className="mt-2 text-[11px] text-gray-400">{group.memberCount || 0} members</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-5">
            {activeTab === "groups" ? (
              <>
                <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
                  <h2 className="text-white font-semibold mb-4">Group Settings</h2>
                  {!selectedGroup ? (
                    <p className="text-sm text-gray-500">Select a group to manage settings.</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Profile Photo with Loading Animation */}
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center text-xs text-gray-400 relative">
                          {uploadingPhoto ? (
                            <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-red-400 to-yellow-400 animate-pulse flex items-center justify-center">
                              <Loader className="h-6 w-6 text-white animate-spin" />
                            </div>
                          ) : selectedGroup.profilePhoto?.secure_url ? (
                            <img src={selectedGroup.profilePhoto.secure_url} alt="Group" className="h-full w-full object-cover" />
                          ) : (
                            (selectedGroup.name || "G").charAt(0).toUpperCase()
                          )}
                        </div>
                        <label className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-900 cursor-pointer disabled:opacity-50">
                          <ImagePlus className="h-4 w-4" /> {uploadingPhoto ? "Uploading..." : "Upload Group Photo"}
                          <input type="file" accept="image/*" className="hidden" onChange={onProfilePhotoSelect} disabled={uploadingPhoto} />
                        </label>
                      </div>

                      <input
                        value={settings.name}
                        onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Group name"
                        className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white"
                      />

                      <textarea
                        value={settings.description}
                        onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Description"
                        rows={2}
                        className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white resize-none"
                      />

                      {/* Instructions Management */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-gray-300 text-sm font-medium">Group Instructions (Bullet Points)</label>
                          <button
                            onClick={addInstruction}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {settings.instructions.length === 0 ? (
                            <p className="text-gray-600 text-xs italic">No instructions added yet</p>
                          ) : (
                            settings.instructions.map((instruction, idx) => (
                              <div key={idx} className="flex gap-2 items-start">
                                <div className="flex-1 relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500">•</span>
                                  <input
                                    value={instruction}
                                    onChange={(e) => updateInstruction(idx, e.target.value)}
                                    placeholder="Enter instruction..."
                                    className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 pl-6 text-sm text-white placeholder:text-gray-700"
                                  />
                                </div>
                                <button
                                  onClick={() => removeInstruction(idx)}
                                  className="text-red-400 hover:text-red-300 p-2 shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <button
                        onClick={saveSettings}
                        disabled={saving || !selectedGroup}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" /> Save Settings
                      </button>
                    </div>
                  )}
                </div>

                {/* Moderation & Member Management */}
                <div className="rounded-xl border border-gray-800 bg-[#111] p-4 space-y-4">
                  <h2 className="text-white font-semibold">Member Management</h2>

                  {/* Add Member Button */}
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-green-600/50 px-3 py-2 text-sm text-green-300 hover:bg-green-900/20"
                  >
                    <Plus className="h-4 w-4" /> Add Member to Group
                  </button>

                  {/* Moderation Actions */}
                  <div>
                    <p className="text-xs text-gray-500 mb-3">Select member and choose action</p>

                    <div className="space-y-3 mb-3">
                      <MemberSelector
                        members={members}
                        selectedUserId={selectedMemberId}
                        onSelect={setSelectedMemberId}
                        isOpen={memberDropdownOpen}
                        onToggle={() => setMemberDropdownOpen(!memberDropdownOpen)}
                        loading={saving}
                      />

                      <input
                        type="number"
                        min={1}
                        value={muteMinutes}
                        onChange={(e) => setMuteMinutes(e.target.value)}
                        placeholder="Mute duration (minutes)"
                        className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => muteMember(selectedMemberId)}
                        disabled={saving || !selectedGroupId || !selectedMemberId}
                        className="inline-flex items-center gap-2 rounded-lg border border-orange-600/50 px-3 py-2 text-sm text-orange-300 hover:bg-orange-900/20 disabled:opacity-50"
                      >
                        <ShieldBan className="h-4 w-4" /> Mute
                      </button>
                      <button
                        onClick={() => {
                          setRemovalTargetUserId(selectedMemberId);
                          setRemovalTargetMemberName(
                            `${selectedMember?.user?.firstName || ""} ${selectedMember?.user?.lastName || ""}`.trim() || "Learner"
                          );
                          setRemovalReason("");
                          setShowRemovalModal(true);
                        }}
                        disabled={saving || !selectedGroupId || !selectedMemberId}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-600/50 px-3 py-2 text-sm text-red-300 hover:bg-red-900/20 disabled:opacity-50"
                      >
                        <UserX className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Rejoin Requests Section */}
                  {rejoinRequests.length > 0 && (
                    <div className="border-t border-gray-800 pt-4">
                      <h3 className="text-sm font-semibold text-blue-300 mb-3">Rejoin Requests ({rejoinRequests.length})</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {rejoinRequests.map((request) => {
                          const fullName = `${request.user?.firstName || ""} ${request.user?.lastName || ""}`.trim() || "Learner";
                          return (
                            <div key={request.user?._id} className="rounded-lg border border-blue-800/50 bg-blue-900/20 p-3">
                              <div className="mb-2">
                                <div className="text-sm text-gray-200">{fullName}</div>
                                <div className="text-xs text-gray-500">{request.user?.email || request.user?._id}</div>
                                {request.rejoinRequestReason && (
                                  <div className="text-xs text-gray-400 mt-2 p-2 bg-black/30 rounded italic">{request.rejoinRequestReason}</div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setFinalWarningUserId(request.user?._id);
                                    setShowFinalWarningModal(true);
                                  }}
                                  disabled={saving}
                                  className="flex-1 px-2 py-1 rounded bg-blue-600/80 text-white text-xs hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => rejectRejoinRequest(request.user?._id)}
                                  disabled={saving}
                                  className="flex-1 px-2 py-1 rounded bg-gray-700 text-white text-xs hover:bg-gray-600 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Muted & Removed Members List */}
                  <div className="border-t border-gray-800 pt-4">
                    <h3 className="text-sm font-semibold text-gray-200 mb-3">Muted & Removed Members</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredMembers.length === 0 ? (
                        <p className="text-xs text-gray-500">No muted or removed members</p>
                      ) : (
                        filteredMembers.map((member) => {
                          const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.trim() || "Learner";
                          const mutedActive = member.mutedUntil && new Date(member.mutedUntil).getTime() > Date.now();
                          return (
                            <div key={member._id} className="rounded-lg border border-gray-800 bg-black/20 p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="text-sm text-gray-200">{fullName}</div>
                                  <div className="text-xs text-gray-500">{member.user?.email || member.user?._id}</div>
                                </div>
                                <div className="flex gap-1">
                                  {mutedActive ? (
                                    <button
                                      onClick={() => unmuteMember(member.user?._id)}
                                      className="px-2 py-1 rounded border border-green-600/50 text-green-300 text-xs hover:bg-green-900/20"
                                    >
                                      Unmute
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                              {mutedActive && (
                                <div className="text-[11px] text-orange-300 inline-flex items-center gap-1 mb-2">
                                  <Clock3 className="h-3.5 w-3.5" /> Muted until{" "}
                                  {new Date(member.mutedUntil).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                    timeZone: "Asia/Kolkata",
                                  })}{" "}
                                  IST
                                </div>
                              )}
                              {member.status === "removed" && member.removalReason && (
                                <div className="text-xs text-gray-300 p-2 bg-red-900/30 rounded border border-red-800/50 italic">
                                  <span className="font-semibold text-red-300">Removal reason:</span> {member.removalReason}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
                  <h2 className="text-white font-semibold mb-3">Recent Messages</h2>
                  <div className="space-y-2 max-h-70 overflow-y-auto">
                    {recentMessages.length === 0 ? (
                      <p className="text-sm text-gray-500">No recent messages.</p>
                    ) : (
                      recentMessages.map((message) => (
                        <div key={message._id} className="rounded-lg border border-gray-800 bg-black/30 p-3">
                          <div className="text-xs text-gray-500 mb-1">{buildSenderName(message.sender)}</div>
                          <div className="text-sm text-gray-200 line-clamp-2">{message.content || "[Attachment]"}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-gray-800 bg-[#111] overflow-hidden">
                {!selectedGroup ? (
                  <div className="p-5 text-sm text-gray-500">Select a group from Groups tab to start chat.</div>
                ) : (
                  <>
                    <div className="border-b border-gray-800 p-4">
                      <h2 className="text-white font-semibold">{selectedGroup.name}</h2>
                      <p className="text-xs text-gray-500 mt-1">{selectedGroup.course?.title || "Course chat"}</p>
                    </div>

                    <div className="h-[52vh] overflow-y-auto p-4 space-y-2 bg-[#0c0c0c]">
                      {messages.length === 0 ? (
                        <p className="text-sm text-gray-500">No messages yet. Start chatting with learners.</p>
                      ) : (
                        messages.map((message) => {
                          const mine = message.senderRole === "Instructor";
                          return (
                            <div key={message._id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm border ${mine ? "ml-auto bg-yellow-400/20 border-yellow-500/40" : "bg-[#161616] border-gray-800"}`}>
                              <div className="text-[11px] text-gray-400 mb-1">{buildSenderName(message.sender)}</div>
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
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                                <button onClick={() => setReplyTo(message)} className="inline-flex items-center gap-1 hover:text-gray-200">
                                  <Reply className="h-3 w-3" /> Reply
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="border-t border-gray-800 p-3 space-y-2">
                      {replyTo ? (
                        <div className="rounded-lg border border-gray-700 bg-black/30 px-3 py-2 text-xs text-gray-300 flex items-center justify-between">
                          <span>Replying to: {replyTo.content || "[Attachment]"}</span>
                          <button className="text-gray-400 hover:text-white" onClick={() => setReplyTo(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-1">
                        {EMOJIS.map((emoji) => (
                          <button key={emoji} onClick={() => appendEmoji(emoji)} className="rounded border border-gray-700 bg-black/30 px-2 py-1 text-sm">
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-gray-700 p-2 text-gray-300 hover:bg-gray-900">
                          <Paperclip className="h-4 w-4" />
                          <input type="file" multiple className="hidden" onChange={onFileSelect} />
                        </label>
                        <input
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
                          className="flex-1 rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm text-gray-100"
                        />
                        <button onClick={sendMessage} disabled={saving} className="inline-flex items-center gap-1 rounded-xl bg-yellow-400 px-3 py-2 text-sm font-semibold text-black disabled:opacity-50">
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
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setSearchNonJoined("");
        }}
        onSubmit={addMember}
        loading={saving}
        nonJoinedMembers={nonJoinedMembers}
        searchQuery={searchNonJoined}
        setSearchQuery={setSearchNonJoined}
      />

      {/* Modals */}
      <RemovalReasonModal
        isOpen={showRemovalModal}
        onClose={() => {
          setShowRemovalModal(false);
          setRemovalTargetUserId("");
          setRemovalTargetMemberName("");
          setRemovalReason("");
        }}
        onSubmit={(reason) => removeMember(removalTargetUserId, reason)}
        targetMemberName={removalTargetMemberName}
        loading={removalReasonLoading}
        removalReason={removalReason}
        setRemovalReason={setRemovalReason}
      />

      <FinalWarningModal
        isOpen={showFinalWarningModal}
        onClose={() => {
          setShowFinalWarningModal(false);
          setFinalWarningUserId("");
        }}
        onAccept={() => acceptRejoinRequest(finalWarningUserId)}
        memberName={
          finalWarningMember
            ? `${finalWarningMember.user?.firstName || ""} ${finalWarningMember.user?.lastName || ""}`.trim()
            : ""
        }
        loading={saving}
      />

      <RejoinRequestModal
        isOpen={showRejoinRequestModal}
        onClose={() => {
          setShowRejoinRequestModal(false);
          setRejoinRequestReason("");
        }}
        onSubmit={() => {
          // This will be called from user frontend, not instructor
          setShowRejoinRequestModal(false);
        }}
        loading={saving}
        rejoinRequestReason={rejoinRequestReason}
        setRejoinRequestReason={setRejoinRequestReason}
      />
    </InstructorLayout>
  );
}
 