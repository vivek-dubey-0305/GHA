//useLiveClassRealtime.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { apiClient } from "../utils/api.utils";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://gha-1b4t.onrender.com";

const buildParticipantMap = (participants = []) => {
  const map = new Map();
  participants.forEach((participant) => {
    const key = participant.socketId || `${participant.userId}:${participant.joinedAt || "na"}`;
    map.set(key, participant);
  });
  return map;
};

const normalizeChatMessages = (messages = []) => {
  const seen = new Set();
  const unique = [];

  messages.forEach((item) => {
    const key = `${item.sender || ""}:${item.message || ""}:${new Date(item.timestamp || 0).getTime()}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });

  return unique.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
};

export function useLiveClassRealtime({
  enabled,
  liveClassId,
  lessonId,
  user,
  onStatePatch,
}) {
  const socketRef = useRef(null);
  const burstTimeoutsRef = useRef([]);
  const uiTimeoutsRef = useRef([]);

  const [connected, setConnected] = useState(false);
  const [totalOnline, setTotalOnline] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [reactionBursts, setReactionBursts] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState("");
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [hasUnreadUsers, setHasUnreadUsers] = useState(false);
  const [floatingCards, setFloatingCards] = useState([]);

  const me = useMemo(() => {
    const profilePicture =
      user?.profilePicture?.secure_url || user?.profilePicture?.url || user?.profilePicture || null;

    return {
      userId: user?._id || user?.id || "",
      name: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Student",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      profilePicture,
      role: "User",
    };
  }, [user]);

  const spawnReactionBurst = useCallback((emoji) => {
    const base = Date.now() + Math.floor(Math.random() * 1000);
    const particles = Array.from({ length: 3 }).map((_, idx) => ({
      id: `${base}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      emoji,
      left: `${10 + Math.floor(Math.random() * 80)}%`,
      delayMs: idx * 100,
      durationMs: 1500 + Math.floor(Math.random() * 700),
      sizePx: 18 + Math.floor(Math.random() * 10),
    }));

    setReactionBursts((prev) => [...prev.slice(-50), ...particles]);

    particles.forEach((particle) => {
      const timer = setTimeout(() => {
        setReactionBursts((prev) => prev.filter((item) => item.id !== particle.id));
      }, particle.durationMs + particle.delayMs + 200);
      burstTimeoutsRef.current.push(timer);
    });
  }, []);

  const pushFloatingCard = useCallback((payload) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const card = {
      id,
      type: payload.type,
      title: payload.title,
      subtitle: payload.subtitle,
      durationMs: payload.durationMs,
    };

    setFloatingCards((prev) => [...prev.slice(-3), card]);

    const timer = setTimeout(() => {
      setFloatingCards((prev) => prev.filter((item) => item.id !== id));
    }, payload.durationMs);
    uiTimeoutsRef.current.push(timer);
  }, []);

  const markChatRead = useCallback(() => {
    setHasUnreadChat(false);
  }, []);

  const markUsersRead = useCallback(() => {
    setHasUnreadUsers(false);
  }, []);

  const dismissFloatingCard = useCallback((id) => {
    setFloatingCards((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const syncStatePatch = useCallback(
    (patch) => {
      onStatePatch?.(lessonId, patch);
    },
    [lessonId, onStatePatch]
  );

  const loadFallbackSnapshots = useCallback(async () => {
    if (!liveClassId) return;

    setLoadingParticipants(true);
    try {
      const [chatRes, participantsRes] = await Promise.all([
        apiClient.get(`/live-classes/${liveClassId}/chat?limit=50`),
        apiClient.get(`/live-classes/${liveClassId}/participants-user`),
      ]);

      const chatList = chatRes?.data?.data?.messages || [];
      const participantList = participantsRes?.data?.data?.participants || [];
      const online = Number(participantsRes?.data?.data?.online || participantList.length || 0);

      setChatMessages(normalizeChatMessages(chatList));
      setParticipants(participantList);
      setTotalOnline(online);
      syncStatePatch({ totalOnline: online });
    } catch {
      // Fallback snapshots are best-effort.
    } finally {
      setLoadingParticipants(false);
    }
  }, [liveClassId, syncStatePatch]);

  useEffect(() => {
    if (!enabled || !liveClassId || !me.userId) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
      socket.emit("join_live_class", {
        liveClassId,
        userId: me.userId,
        role: me.role,
        name: me.name,
        firstName: me.firstName,
        lastName: me.lastName,
        profilePicture: me.profilePicture,
      });

      // Re-sync snapshots after (re)connect so recent room data is recovered if a socket event was missed.
      loadFallbackSnapshots();
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on("session_snapshot", (payload) => {
      if (String(payload?.liveClassId) !== String(liveClassId)) return;
      const online = Number(payload?.totalOnline || 0);
      setTotalOnline(online);
      syncStatePatch({
        broadcastStarted: !!payload.broadcastStarted,
        waitingForHost: !payload.broadcastStarted,
        sessionEnded: false,
        totalOnline: online,
      });
    });

    socket.on("participant_list_snapshot", (payload) => {
      if (String(payload?.liveClassId) !== String(liveClassId)) return;
      const list = Array.isArray(payload?.participants) ? payload.participants : [];
      setParticipants(list);
      const online = Number(payload?.totalOnline || list.length || 0);
      setTotalOnline(online);
      syncStatePatch({ totalOnline: online });
    });

    socket.on("participant_joined", (payload) => {
      if (!payload) return;
      if (String(payload?.userId || "") !== String(me.userId || "")) {
        setHasUnreadUsers(true);
        pushFloatingCard({
          type: "user",
          title: "Participant joined",
          subtitle: payload?.name || "A learner joined",
          durationMs: 3000,
        });
      }
      setParticipants((prev) => {
        const map = buildParticipantMap(prev);
        const key = payload.socketId || `${payload.userId}:${payload.joinedAt || "na"}`;
        map.set(key, payload);
        return Array.from(map.values());
      });
      if (Number.isFinite(payload?.totalOnline)) {
        const online = Number(payload.totalOnline);
        setTotalOnline(online);
        syncStatePatch({ totalOnline: online });
      }
    });

    socket.on("participant_left", (payload) => {
      if (!payload) return;
      setParticipants((prev) => {
        if (payload.socketId) {
          return prev.filter((participant) => participant.socketId !== payload.socketId);
        }
        const idx = prev.findIndex((participant) => String(participant.userId) === String(payload.userId));
        if (idx === -1) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
    });

    socket.on("participant_count_updated", (payload) => {
      if (String(payload?.liveClassId) !== String(liveClassId)) return;
      const online = Number(payload?.totalOnline || 0);
      setTotalOnline(online);
      syncStatePatch({ totalOnline: online });
    });

    socket.on("chat_history_snapshot", (payload) => {
      if (String(payload?.liveClassId) !== String(liveClassId)) return;
      const messages = Array.isArray(payload?.messages) ? payload.messages : [];
      setChatMessages(normalizeChatMessages(messages));
    });

    socket.on("chat_message", (payload) => {
      if (!payload) return;
      const senderName = payload?.senderName || payload?.sender?.name || "";
      if (senderName && senderName !== me.name && payload?.type !== "system") {
        setHasUnreadChat(true);
        pushFloatingCard({
          type: "chat",
          title: senderName,
          subtitle: payload?.message || payload?.text || "",
          durationMs: 5000,
        });
      }
      setChatMessages((prev) => normalizeChatMessages([...prev, payload]));
    });

    socket.on("emoji_reaction", (payload) => {
      if (!payload?.emoji) return;
      if (String(payload?.userId || "") === String(me.userId || "")) {
        return;
      }
      spawnReactionBurst(payload.emoji);
    });

    socket.on("broadcast_started", (payload) => {
      if (String(payload?.liveClassId) !== String(liveClassId)) return;
      syncStatePatch({ broadcastStarted: true, waitingForHost: false, sessionEnded: false });
    });

    socket.on("broadcast_stopped", (payload) => {
      if (String(payload?.liveClassId) !== String(liveClassId)) return;
      syncStatePatch({ broadcastStarted: false, waitingForHost: true });
    });

    socket.on("session_ended", (payload) => {
      if (String(payload?.liveClassId) !== String(liveClassId)) return;
      syncStatePatch({
        sessionEnded: true,
        broadcastStarted: false,
        waitingForHost: false,
        summary: payload?.summary || null,
      });
    });

    return () => {
      burstTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      burstTimeoutsRef.current = [];
      uiTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      uiTimeoutsRef.current = [];

      socket.emit("leave_live_class", { liveClassId });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, liveClassId, me, loadFallbackSnapshots, pushFloatingCard, spawnReactionBurst, syncStatePatch]);

  const sendReaction = useCallback(
    (emoji) => {
      spawnReactionBurst(emoji);

      if (!emoji || !liveClassId || !socketRef.current?.connected) {
        return;
      }

      socketRef.current.emit("emoji_reaction", {
        liveClassId,
        emoji,
      });
    },
    [liveClassId, spawnReactionBurst]
  );

  const sendChatMessage = useCallback(
    async (message) => {
      const trimmed = String(message || "").trim();
      if (!trimmed || !liveClassId || sendingChat) return false;

      setSendingChat(true);
      setChatError("");
      try {
        if (socketRef.current?.connected) {
          socketRef.current.emit("live_chat", {
            liveClassId,
            message: trimmed,
            senderName: me.name,
            senderRole: me.role,
            type: "chat",
          });

          apiClient.post(`/live-classes/${liveClassId}/chat`, {
            message: trimmed,
            type: "chat",
            skipBroadcast: true,
          }).catch(() => {
            setChatError("Message sent in realtime, but could not be saved to history.");
          });
        } else {
          await apiClient.post(`/live-classes/${liveClassId}/chat`, {
            message: trimmed,
            type: "chat",
          });
        }
        return true;
      } catch {
        setChatError("Failed to send message. Check connection and try again.");
        return false;
      } finally {
        setSendingChat(false);
      }
    },
    [liveClassId, me.name, me.role, sendingChat]
  );

  return {
    connected,
    totalOnline,
    participants,
    chatMessages,
    reactionBursts,
    loadingParticipants,
    sendingChat,
    chatError,
    hasUnreadChat,
    hasUnreadUsers,
    floatingCards,
    sendReaction,
    sendChatMessage,
    markChatRead,
    markUsersRead,
    dismissFloatingCard,
    reloadSnapshots: loadFallbackSnapshots,
  };
}
