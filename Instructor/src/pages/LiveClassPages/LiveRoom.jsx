//instructor/src/pages/LiveClassPages/LiveRoom.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Hls from 'hls.js';
import {
  ArrowLeft, Send, Hand, Users, MessageSquare, Radio,
  X, Smile, ChevronDown, MicOff, Eye, EyeOff, Gauge, Maximize2, Minimize2,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  joinAsInstructor, endLiveClass,
  clearMutationState, clearSignedPlayback,
  selectSignedPlayback, selectMutationLoading,
} from '../../redux/slices/liveclass.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import apiClient from '../../utils/api.utils';

// const SOCKET_URL = 'http://localhost:5000';
const SOCKET_URL = 'https://gha-1b4t.onrender.com';
const LIVE_REACTIONS = ['👏', '👍', '🔥', '❤️', '🎉', '🙌'];

const dedupeParticipants = (list = []) => {
  const map = new Map();
  list.forEach((item) => {
    if (!item) return;
    const key = item.userId ? `${item.role || 'User'}:${item.userId}` : `${item.role || 'User'}:${item.socketId || item.name}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
};

export default function LiveRoom() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const signedPlayback = useSelector(selectSignedPlayback);
  const mutLoading = useSelector(selectMutationLoading);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const joinStartedRef = useRef(false);
  const retryCountRef = useRef(0);
  const roomRootRef = useRef(null);
  const uiHideTimerRef = useRef(null);

  // State
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [totalOnline, setTotalOnline] = useState(1);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [myName, setMyName] = useState('');
  const [myUserId, setMyUserId] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState([]);
  const [mutedParticipants, setMutedParticipants] = useState(new Set());
  const [broadcastStarted, setBroadcastStarted] = useState(false);
  const [enableSelfPreview, setEnableSelfPreview] = useState(false);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [selectedQualityLevel, setSelectedQualityLevel] = useState(-1); // -1 => auto
  const [reactionBursts, setReactionBursts] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUiChrome, setShowUiChrome] = useState(true);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [hasUnreadUsers, setHasUnreadUsers] = useState(false);
  const [floatingCards, setFloatingCards] = useState([]);
  // add this near other states
  const [socketId, setSocketId] = useState(null);
  const showChatRef = useRef(showChat);
  const showParticipantsRef = useRef(showParticipants);

  useEffect(() => {
    showChatRef.current = showChat;
    showParticipantsRef.current = showParticipants;
  }, [showChat, showParticipants]);

  const pingUiChrome = useCallback(() => {
    if (!isFullscreen) return;
    setShowUiChrome(true);
    if (uiHideTimerRef.current) {
      clearTimeout(uiHideTimerRef.current);
    }
    uiHideTimerRef.current = setTimeout(() => {
      setShowUiChrome(false);
    }, 2200);
  }, [isFullscreen]);

  const spawnReactionBurst = useCallback((emoji) => {
    const base = Date.now() + Math.floor(Math.random() * 1000);
    const particles = Array.from({ length: 3 }).map((_, idx) => ({
      id: `${base}-${idx}`,
      emoji,
      left: `${10 + Math.floor(Math.random() * 80)}%`,
      delayMs: idx * 100,
      durationMs: 1500 + Math.floor(Math.random() * 700),
      sizePx: 18 + Math.floor(Math.random() * 10),
    }));

    setReactionBursts((prev) => [...prev, ...particles]);

    particles.forEach((particle) => {
      setTimeout(() => {
        setReactionBursts((prev) => prev.filter((item) => item.id !== particle.id));
      }, particle.durationMs + particle.delayMs + 200);
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

    setTimeout(() => {
      setFloatingCards((prev) => prev.filter((item) => item.id !== id));
    }, payload.durationMs);
  }, []);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  // Clear signed playback only on unmount
  useEffect(() => {
    return () => {
      dispatch(clearSignedPlayback());
    };
  }, [dispatch]);

  // Join the session on mount — use a ref to prevent double-dispatch (StrictMode)
  useEffect(() => {
    if (!id || joinStartedRef.current) return;
    joinStartedRef.current = true;
    console.log('[LiveRoom] Dispatching joinAsInstructor for id:', id);

    dispatch(joinAsInstructor(id))
      .unwrap()
      .then((res) => {
        const data = res.data || res;
        console.log('[LiveRoom] joinAsInstructor SUCCESS:', {
          liveClassId: data.liveClassId,
          status: data.status,
          isHost: data.isHost,
          hasSignedPlayback: !!data.signedPlayback,
          hlsUrl: data.signedPlayback?.hls?.substring(0, 80),
        });
        setSessionInfo(data);
        setJoined(true);
        setIsHost(data.isHost || false);
        setBroadcastStarted(!!data.broadcastStarted);
        setTotalOnline(Math.max(1, Number(data.totalOnline || 1)));
        setMyName(data.instructorName || 'Instructor');
        setMyUserId(data.instructorId || data.userId || '');
      })
      .catch((err) => {
        console.error('[LiveRoom] joinAsInstructor FAILED:', err);
        setJoinError(typeof err === 'string' ? err : err?.message || 'Failed to join session');
      });
  }, [id, dispatch]);

  // Initialize HLS.js for guest participants and optional host self-preview
  useEffect(() => {
    const shouldAttachPlayer = !isHost || enableSelfPreview;
    if (!shouldAttachPlayer) return;

    const hlsUrl = signedPlayback?.hls;

    if (!hlsUrl || !videoRef.current || !broadcastStarted) {
      console.log('[LiveRoom:Video] Skipping — isHost:', isHost, 'selfPreview:', enableSelfPreview, 'hasHls:', !!hlsUrl, 'broadcastStarted:', broadcastStarted);
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    retryCountRef.current = 0;
    console.log('[LiveRoom:Video] Initializing HLS.js (low-latency live edge):', hlsUrl.substring(0, 80));

    if (Hls.isSupported()) {
      console.log("Hls is supported ")
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        capLevelToPlayerSize: true,
        liveSyncDurationCount: 2,       // 1 segment from live edge (~2-4s delay)
        liveMaxLatencyDurationCount: 4, // auto-seek if >2 segments behind
        maxBufferLength: 6,             // 3s forward buffer keeps latency low
        maxLiveSyncPlaybackRate: 1.5,   // helps the player catch up if it falls behind
        backBufferLength: 0,            // no backward buffer
        liveBackBufferLength: 0,        // new viewers always jump to live edge
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        retryCountRef.current = 0;
        console.log('[LiveRoom:Video] ✅ Manifest parsed — snapping to live edge');

        // Build quality options dynamically from the manifest (no hardcoded levels).
        const levels = (hls.levels || []).map((level, index) => ({
          index,
          height: level.height || 0,
          label: level.height ? `${level.height}p` : `Level ${index + 1}`,
        }));
        setQualityLevels(levels);
        setSelectedQualityLevel(-1);

        // Jump to live edge so late joiners don't see buffered start-of-stream segments
        if (hls.liveSyncPosition != null) {
          videoRef.current.currentTime = hls.liveSyncPosition;
        }
        videoRef.current?.play().catch((err) => {
          console.warn('[LiveRoom:Video] Autoplay blocked:', err.message);
        });
      });

      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        // Correct drift if player falls behind live edge
        if (data.details?.live && hls.liveSyncPosition != null && videoRef.current) {
          const drift = hls.liveSyncPosition - videoRef.current.currentTime;
          if (drift > 2) {
            videoRef.current.currentTime = hls.liveSyncPosition;
            console.log('[LiveRoom:Video] Corrected drift — was', drift.toFixed(1), 's behind live edge');
          }
        }
      });

      // hls.on(Hls.Events.ERROR, (event, data) => {
      //   if (data.fatal) {
      //     console.error('[LiveRoom:Video] HLS fatal error:', data.type, data.details);
      //     if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      //       // Exponential backoff — handles manifestParsingError when stream isn't ready yet
      //       const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
      //       retryCountRef.current += 1;
      //       console.log(`[LiveRoom:Video] Retrying in ${delay}ms (attempt ${retryCountRef.current})`);
      //       setTimeout(() => { if (hlsRef.current) hlsRef.current.startLoad(); }, delay);
      //     } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      //       hls.recoverMediaError();
      //     } else {
      //       hls.destroy();
      //       hlsRef.current = null;
      //     }
      //   } else {
      //     console.warn('[LiveRoom:Video] HLS non-fatal:', data.details);
      //   }
      // });

      hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('[LiveRoom:Video] HLS fatal error:', data.type, data.details);

            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {

              // Cloudflare sometimes returns manifestParsingError
              // when OBS stream just started and manifest isn't ready
              if (data.details === "manifestParsingError") {
                console.log("[LiveRoom:Video] Manifest not ready yet — retrying in 2s");
                setTimeout(() => {
                  if (hlsRef.current) hlsRef.current.startLoad();
                }, 2000);
                return;
              }

              // Exponential backoff retry
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
              retryCountRef.current += 1;

              console.log(`[LiveRoom:Video] Retrying in ${delay}ms (attempt ${retryCountRef.current})`);

              setTimeout(() => {
                if (hlsRef.current) hlsRef.current.startLoad();
              }, delay);

            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {

              console.warn("[LiveRoom:Video] Media error — attempting recovery");
              hls.recoverMediaError();

            } else {

              console.error("[LiveRoom:Video] Fatal unrecoverable error — destroying player");
              hls.destroy();
              hlsRef.current = null;

            }

          } else {
            console.warn('[LiveRoom:Video] HLS non-fatal:', data.details);
          }
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('[LiveRoom:Video] Safari native HLS');
      videoRef.current.src = hlsUrl;
      videoRef.current.play().catch(() => {});
    } else {
      console.error('[LiveRoom:Video] HLS not supported in this browser');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [signedPlayback?.hls, broadcastStarted, isHost, enableSelfPreview]);

  // Socket.IO — create connection & join live room
  useEffect(() => {
    const onFullScreenChange = () => {
      const active = document.fullscreenElement === roomRootRef.current;
      setIsFullscreen(active);
      if (!active) {
        setShowUiChrome(true);
        if (uiHideTimerRef.current) {
          clearTimeout(uiHideTimerRef.current);
          uiHideTimerRef.current = null;
        }
      } else {
        pingUiChrome();
      }
    };

    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullScreenChange);
      if (uiHideTimerRef.current) {
        clearTimeout(uiHideTimerRef.current);
        uiHideTimerRef.current = null;
      }
    };
  }, [pingUiChrome]);

  useEffect(() => {
    if (!joined || !id) return;
    console.log('[LiveRoom:Socket] Creating socket connection to', SOCKET_URL);

    // const socket = io(SOCKET_URL, {
    //   withCredentials: true,
    //   transports: ['websocket', 'polling'],
    // });
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[LiveRoom:Socket] Connected, socketId:', socket.id);
      // store socket id in state (safe for render usage)
      setSocketId(socket.id);
      // Join the live class room with correct event name
      socket.emit('join_live_class', {
        liveClassId: id,
        userId: myUserId || socket.id,
        role: 'Instructor',
        name: myName || 'Instructor',
      });
    });

    socket.on('session_snapshot', (payload) => {
      if (String(payload?.liveClassId) !== String(id)) return;
      setBroadcastStarted(!!payload.broadcastStarted);
      setTotalOnline(Math.max(1, Number(payload?.totalOnline || 1)));
    });

    socket.on('participant_list_snapshot', (payload) => {
      if (String(payload?.liveClassId) !== String(id)) return;
      const list = Array.isArray(payload?.participants) ? payload.participants : [];
      setParticipants(dedupeParticipants(list));
      setTotalOnline(Math.max(1, Number(payload?.totalOnline || list.length || 1)));
    });

    // Real-time chat messages
    socket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
      if (!showChatRef.current && msg?.senderName !== myName) {
        setHasUnreadChat(true);
      }
      if (msg?.senderName !== myName) {
        pushFloatingCard({
          type: 'chat',
          title: msg?.senderName || 'New chat message',
          subtitle: msg?.message || msg?.text || '',
          durationMs: 5000,
        });
      }
    });

    // Participant join/leave
    socket.on('participant_joined', (data) => {
      setParticipants(prev => dedupeParticipants([...prev, data]));
      setChatMessages(prev => [...prev, { type: 'system', text: `${data.name} joined`, timestamp: new Date() }]);
      if (!showParticipantsRef.current) {
        setHasUnreadUsers(true);
      }
      pushFloatingCard({
        type: 'user',
        title: 'New participant joined',
        subtitle: data?.name || 'Participant',
        durationMs: 3000,
      });
    });

    socket.on('participant_left', (data) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      if (data.name) {
        setChatMessages(prev => [...prev, { type: 'system', text: `${data.name} left`, timestamp: new Date() }]);
      }
    });

    socket.on('participant_count_updated', (payload) => {
      if (String(payload?.liveClassId) !== String(id)) return;
      setTotalOnline(Math.max(1, Number(payload?.totalOnline || 1)));
    });

    // Session ended by host
    socket.on('session_ended', () => {
      setSessionEnded(true);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    });

    // Raise / lower hand
    socket.on('hand_raised', (data) => {
      setRaisedHands(prev => {
        if (prev.find(h => h.userId === data.userId)) return prev;
        return [...prev, data];
      });
      setChatMessages(prev => [...prev, { type: 'system', text: `${data.name} raised their hand`, timestamp: new Date() }]);
    });

    socket.on('hand_lowered', (data) => {
      setRaisedHands(prev => prev.filter(h => h.userId !== data.userId));
    });

    // Emoji reaction
    socket.on('emoji_reaction', (payload) => {
      if (payload?.emoji) {
        spawnReactionBurst(payload.emoji);
      }
    });

    // Host mute control
    socket.on('participant_muted', (data) => {
      setMutedParticipants(prev => new Set([...prev, data.userId]));
      if (data.userId === (myUserId || socket.id)) {
        setChatMessages(prev => [...prev, { type: 'system', text: 'You have been muted by the host', timestamp: new Date() }]);
      }
    });

    socket.on('participant_unmuted', (data) => {
      setMutedParticipants(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    // Broadcast gate events
    socket.on('broadcast_started', () => {
      console.log('[LiveRoom:Socket] broadcast_started received');
      setBroadcastStarted(true);
    });

    socket.on('broadcast_stopped', () => {
      console.log('[LiveRoom:Socket] broadcast_stopped received');
      setBroadcastStarted(false);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    });

    return () => {
      socket.emit('leave_live_class', { liveClassId: id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [joined, id, myName, myUserId, pushFloatingCard, spawnReactionBurst]);

  const toggleFullscreen = useCallback(async () => {
    const container = roomRootRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err?.message || err);
    }
  }, []);

  // Load existing chat history
  useEffect(() => {
    if (!joined || !id) return;
    apiClient.get(`/live-classes/${id}/chat-instructor`).then(res => {
      const msgs = res.data?.data?.messages || [];
      setChatMessages(msgs);
    }).catch(() => {});
  }, [joined, id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // End session handler (host only)
  const handleEndSession = useCallback(() => {
    if (!id || mutLoading) return;
    dispatch(endLiveClass(id)).unwrap().then(() => {
      dispatch(clearMutationState());
      setSessionEnded(true);
    }).catch(() => {});
  }, [id, dispatch, mutLoading]);

  // Send chat message — via Socket for real-time broadcast
  const handleSendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !id) return;

    // Send via socket for instant broadcast to all participants
    if (socketRef.current?.connected) {
      socketRef.current.emit('live_chat', {
        liveClassId: id,
        message: text,
        senderName: myName,
        senderRole: 'Instructor',
      });
    }

    // Persist in DB (skipBroadcast to avoid duplicate since socket already broadcast)
    apiClient.post(`/live-classes/${id}/chat-instructor`, { message: text, skipBroadcast: true }).catch(() => {});
    setChatInput('');
  }, [chatInput, id, myName]);

  // Raise hand via socket
  const handleRaiseHand = useCallback(() => {
    if (!id || !socketRef.current?.connected) return;
    if (handRaised) {
      socketRef.current.emit('lower_hand', { liveClassId: id, userId: myUserId || socketRef.current.id });
      setHandRaised(false);
    } else {
      socketRef.current.emit('raise_hand', { liveClassId: id });
      setHandRaised(true);
    }
  }, [id, handRaised, myUserId]);

  // Host: mute a participant
  const handleMuteParticipant = useCallback((userId) => {
    if (!isHost || !socketRef.current?.connected) return;
    const isMuted = mutedParticipants.has(userId);
    socketRef.current.emit(isMuted ? 'unmute_participant' : 'mute_participant', {
      liveClassId: id,
      userId,
    });
    if (isMuted) {
      setMutedParticipants(prev => { const next = new Set(prev); next.delete(userId); return next; });
    } else {
      setMutedParticipants(prev => new Set([...prev, userId]));
    }
  }, [isHost, id, mutedParticipants]);

  // Host: lower someone's hand
  const handleLowerHand = useCallback((userId) => {
    if (!isHost || !socketRef.current?.connected) return;
    socketRef.current.emit('lower_hand', { liveClassId: id, userId });
  }, [isHost, id]);

  // Emoji reaction
  const handleReaction = useCallback((emoji) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('emoji_reaction', { liveClassId: id, emoji });
  }, [id]);

  // Host: start broadcasting — participants will be able to watch the HLS stream
  const handleStartBroadcast = useCallback(() => {
    if (!id || !socketRef.current?.connected) return;
    socketRef.current.emit('start_broadcast', { liveClassId: id });
    setBroadcastStarted(true);
  }, [id]);

  // Host: stop broadcasting
  const handleStopBroadcast = useCallback(() => {
    if (!id || !socketRef.current?.connected) return;
    socketRef.current.emit('stop_broadcast', { liveClassId: id });
    setBroadcastStarted(false);
  }, [id]);

  const handleQualityChange = useCallback((event) => {
    const value = Number(event.target.value);
    const hls = hlsRef.current;
    if (!hls) return;

    if (value === -1) {
      hls.currentLevel = -1;
      hls.nextLevel = -1;
      hls.loadLevel = -1;
      setSelectedQualityLevel(-1);
      return;
    }

    hls.nextLevel = value;
    hls.currentLevel = value;
    setSelectedQualityLevel(value);

    if (hls.liveSyncPosition != null && videoRef.current) {
      videoRef.current.currentTime = hls.liveSyncPosition;
    }
  }, []);

  // Leave room
  const handleLeave = useCallback(() => {
    navigate('/instructor/live-classes');
  }, [navigate]);

  // ── Join error state ──
  if (joinError) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Radio className="w-10 h-10 text-gray-600 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Cannot Join Session</h2>
          <p className="text-gray-400 text-sm mb-4">{joinError}</p>
          <button onClick={handleLeave} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Back to Live Classes
          </button>
        </div>
      </InstructorLayout>
    );
  }

  // ── Session ended overlay ──
  if (sessionEnded) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-4 rounded-full bg-red-500/10 mb-4">
            <X className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Session Ended</h2>
          <p className="text-gray-400 text-sm mb-6">The live session has been ended by the host.</p>
          <button onClick={handleLeave} className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Back to Live Classes
          </button>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div
        ref={roomRootRef}
        className="h-[calc(100vh-64px)] flex flex-col lg:flex-row bg-black"
        onMouseMove={pingUiChrome}
        onTouchStart={pingUiChrome}
      >
        {/* ── Video Area ── */}
        <div className="flex-1 flex flex-col bg-black min-h-0">
          {/* Top bar */}
          <div className={`flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-gray-800 transition-opacity duration-300 ${isFullscreen && !showUiChrome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center gap-3">
              <button onClick={handleLeave} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-white text-sm font-semibold truncate max-w-75">
                  {sessionInfo?.title || 'Live Session'}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-red-400 text-[10px] font-medium uppercase">Live</span>
                    <span className="text-gray-600 text-[10px]">{totalOnline} watching</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {broadcastStarted && (!isHost || enableSelfPreview) && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-900 border border-gray-700">
                  <Gauge className="w-3.5 h-3.5 text-blue-300" />
                  <select
                    value={selectedQualityLevel}
                    onChange={handleQualityChange}
                    className="bg-transparent text-[11px] text-gray-200 outline-none"
                    title="Switch playback quality"
                    disabled={qualityLevels.length === 0}
                  >
                    <option value={-1}>Auto</option>
                    {qualityLevels.length === 0 && (
                      <option value={-1}>Loading qualities...</option>
                    )}
                    {qualityLevels
                      .slice()
                      .sort((a, b) => b.height - a.height)
                      .map((level) => (
                        <option key={level.index} value={level.index}>
                          {level.label}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => {
                  const next = !showParticipants;
                  setShowParticipants(next);
                  if (next) {
                    setHasUnreadUsers(false);
                    setShowChat(false);
                  }
                }}
                className={`p-2 rounded-lg transition-colors text-sm relative ${showParticipants ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <Users className="w-4 h-4" />
                {hasUnreadUsers && !showParticipants ? (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500" />
                ) : null}
                {raisedHands.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {raisedHands.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  const next = !showChat;
                  setShowChat(next);
                  if (next) {
                    setHasUnreadChat(false);
                    setShowParticipants(false);
                  }
                }}
                className={`p-2 rounded-lg transition-colors text-sm relative ${showChat ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <MessageSquare className="w-4 h-4" />
                {hasUnreadChat && !showChat ? (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500" />
                ) : null}
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {isHost ? (
                <button
                  onClick={handleEndSession}
                  disabled={mutLoading}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  End Session
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  className="px-3 py-1.5 bg-gray-700 text-white text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Leave
                </button>
              )}
            </div>
          </div>

          {/* Broadcast / Video Area */}
          <div className="flex-1 flex items-center justify-center bg-black min-h-0 relative">
            {floatingCards.length > 0 ? (
              <div className="absolute top-3 left-3 z-40 space-y-2 pointer-events-none">
                {floatingCards.map((card) => (
                  <div key={card.id} className="pointer-events-auto w-72 rounded-lg border border-gray-700 bg-[#121212]/95 backdrop-blur px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-yellow-300 capitalize">{card.type}</p>
                        <p className="text-sm text-gray-100 truncate">{card.title}</p>
                        {card.subtitle ? <p className="text-xs text-gray-400 truncate">{card.subtitle}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFloatingCards((prev) => prev.filter((item) => item.id !== card.id))}
                        className="h-6 w-6 rounded-md border border-gray-700 text-gray-300 inline-flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {reactionBursts.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {reactionBursts.map((burst) => (
                  <span
                    key={burst.id}
                    className="absolute bottom-6 live-reaction-float"
                    style={{
                      left: burst.left,
                      fontSize: `${burst.sizePx}px`,
                      animationDelay: `${burst.delayMs}ms`,
                      animationDuration: `${burst.durationMs}ms`,
                    }}
                  >
                    {burst.emoji}
                  </span>
                ))}
              </div>
            )}

            {isHost ? (
              /* Host panel with optional delayed self-preview for quality monitoring */
              <div className="flex flex-col items-center justify-center gap-6 p-8 text-center w-full h-full">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <span className="text-red-400 text-sm font-semibold uppercase tracking-widest">You Are Live via OBS</span>
                </div>
                <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                  Your OBS stream is connected and encoding. Click below when everyone has joined and you're ready to start.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEnableSelfPreview((prev) => !prev)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors flex items-center gap-2"
                  >
                    {enableSelfPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {enableSelfPreview ? 'Hide Self Preview' : 'Enable Self Preview'}
                  </button>
                  <span className="text-[11px] text-gray-500">
                    Preview helps verify stream quality (2-5s delayed)
                  </span>
                </div>
                {!broadcastStarted ? (
                  <button
                    onClick={handleStartBroadcast}
                    disabled={!joined}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Radio className="w-4 h-4" /> Start Broadcasting to Participants
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="px-5 py-2.5 bg-green-600/20 border border-green-600/30 text-green-400 text-sm rounded-xl flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                      Participants are watching your stream
                    </div>
                    <button
                      onClick={handleStopBroadcast}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg transition-colors"
                    >
                      Stop Broadcasting
                    </button>
                  </div>
                )}

                {broadcastStarted && enableSelfPreview && (
                  <div className="w-full max-w-3xl rounded-xl border border-gray-800 overflow-hidden bg-black">
                    <div className="px-3 py-2 bg-[#111] border-b border-gray-800 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-300 font-medium">HLS Self Preview</p>
                          <p className="text-[11px] text-gray-500">If quality drops, restart OBS stream from Go Live setup.</p>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-gray-900 border border-gray-700">
                          <Gauge className="w-3.5 h-3.5 text-blue-300" />
                          <select
                            value={selectedQualityLevel}
                            onChange={handleQualityChange}
                            className="bg-transparent text-[11px] text-gray-200 outline-none"
                            title="Switch self-preview quality"
                            disabled={qualityLevels.length === 0}
                          >
                            <option value={-1}>Auto</option>
                            {qualityLevels.length === 0 && (
                              <option value={-1}>Loading qualities...</option>
                            )}
                            {qualityLevels
                              .slice()
                              .sort((a, b) => b.height - a.height)
                              .map((level) => (
                                <option key={`preview-${level.index}`} value={level.index}>
                                  {level.label}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <video
                      ref={videoRef}
                      className="w-full aspect-video"
                      controls
                      controlsList="nofullscreen noremoteplayback"
                      autoPlay
                      muted
                      playsInline
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Guest: HLS player — only active after host starts broadcast */
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  controlsList="nofullscreen noremoteplayback"
                  autoPlay
                  playsInline
                />
                {!broadcastStarted && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-3">
                    <Radio className="w-8 h-8 text-gray-600 animate-pulse" />
                    <p className="text-gray-500 text-sm">Waiting for host to start broadcasting...</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom actions */}
          <div className={`flex items-center justify-center gap-3 px-4 py-2 bg-[#0a0a0a] border-t border-gray-800 transition-opacity duration-300 ${isFullscreen && !showUiChrome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button
              onClick={handleRaiseHand}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                handRaised
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-600/20 border border-yellow-600/30 text-yellow-400 hover:bg-yellow-600/30'
              }`}
            >
              <Hand className="w-3.5 h-3.5" /> {handRaised ? 'Lower Hand' : 'Raise Hand'}
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5" /> React
              </span>
              {LIVE_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="px-2.5 py-1.5 bg-gray-800 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Side Panel (Chat / Participants) ── */}
        {(showChat || showParticipants) && (
          <div className={`w-full lg:w-80 flex flex-col bg-[#0f0f0f] border-l border-gray-800 h-64 lg:h-auto transition-opacity duration-300 ${isFullscreen && !showUiChrome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-white text-sm font-semibold">
                {showParticipants ? `Participants (${totalOnline})` : 'Live Chat'}
              </h3>
              <button onClick={() => { setShowChat(false); setShowParticipants(false); }} className="p-1 rounded text-gray-500 hover:text-white">
                <ChevronDown className="w-4 h-4 lg:hidden" />
                <X className="w-4 h-4 hidden lg:block" />
              </button>
            </div>

            {showParticipants ? (
              /* Participants List */
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {/* Raised hands section */}
                {raisedHands.length > 0 && (
                  <div className="mb-3">
                    <p className="text-yellow-400 text-[10px] font-semibold uppercase px-2 mb-1">Raised Hands</p>
                    {raisedHands.map((h, i) => (
                      <div key={h.userId || i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-yellow-600/10 border border-yellow-600/20 mb-1">
                        <Hand className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                        <p className="text-yellow-300 text-xs truncate flex-1">{h.name}</p>
                        {isHost && (
                          <button onClick={() => handleLowerHand(h.userId)} className="text-gray-500 hover:text-white text-[10px]">
                            Dismiss
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {participants.length > 0 ? participants.map((p, i) => (
                  <div key={p.userId || i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/50">
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-medium">
                      {(p.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs truncate">{p.name}</p>
                      <p className="text-gray-600 text-[10px]">{p.role}</p>
                    </div>
                    {/* Host mic control */}
                    {/* {isHost && p.userId !== (myUserId || socketRef.current?.id) && ( */}
                    {/* avoid reading socketRef.current during render */}
                    {isHost && p.userId !== (myUserId || socketId) && (
                      <button
                        onClick={() => handleMuteParticipant(p.userId)}
                        className={`p-1 rounded transition-colors ${
                          mutedParticipants.has(p.userId)
                            ? 'text-red-400 hover:text-red-300'
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                        title={mutedParticipants.has(p.userId) ? 'Unmute' : 'Mute'}
                      >
                        <MicOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )) : (
                  <p className="text-gray-600 text-xs text-center py-4">No participants yet</p>
                )}
              </div>
            ) : (
              /* Chat */
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {chatMessages.length > 0 ? chatMessages.map((msg, i) => (
                    msg.type === 'system' ? (
                      <div key={i} className="text-center text-gray-600 text-[10px] py-1">{msg.text}</div>
                    ) : (
                      <div key={i} className="group">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-medium shrink-0 mt-0.5">
                            {(msg.senderName || msg.sender?.name || '?')[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-gray-300 text-[11px] font-medium">{msg.senderName || msg.sender?.name}</span>
                              <span className="text-gray-700 text-[9px]">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-gray-400 text-xs wrap-break-word">{msg.message || msg.text}</p>
                          </div>
                        </div>
                      </div>
                    )
                  )) : (
                    <p className="text-gray-600 text-xs text-center py-4">No messages yet. Say hi!</p>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                      className="flex-1 bg-[#0d0d0d] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
                      placeholder="Type a message..."
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim()}
                      className="p-2 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .live-reaction-float {
          animation-name: liveReactionFloat;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
          opacity: 0;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.45));
        }

        @keyframes liveReactionFloat {
          0% {
            transform: translateY(0) scale(0.7);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          100% {
            transform: translateY(-240px) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>

    </InstructorLayout>
  );
}
