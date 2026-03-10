import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Hls from 'hls.js';
import {
  ArrowLeft, Send, Hand, Users, MessageSquare, Radio,
  X, Smile, ChevronDown, MicOff,
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

  // State
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState([]);
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
  // add this near other states
  const [socketId, setSocketId] = useState(null);

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
        setMyName(data.instructorName || 'Instructor');
        setMyUserId(data.liveClassId ? '' : '');
      })
      .catch((err) => {
        console.error('[LiveRoom] joinAsInstructor FAILED:', err);
        setJoinError(typeof err === 'string' ? err : err?.message || 'Failed to join session');
      });
  }, [id, dispatch]);

  // Initialize HLS.js for guest participants — gated behind broadcastStarted
  // Host never plays the HLS stream (prevents OBS "infinite mirror" feedback loop)
  useEffect(() => {
    if (isHost) return;
    const hlsUrl = signedPlayback?.hls;

    if (!hlsUrl || !videoRef.current || !broadcastStarted) {
      console.log('[LiveRoom:Video] Skipping — isHost:', isHost, 'hasHls:', !!hlsUrl, 'broadcastStarted:', broadcastStarted);
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    retryCountRef.current = 0;
    console.log('[LiveRoom:Video] Initializing HLS.js (low-latency live edge):', hlsUrl.substring(0, 80));

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 1,       // 1 segment from live edge (~2-4s delay)
        liveMaxLatencyDurationCount: 2, // auto-seek if >2 segments behind
        maxBufferLength: 3,             // 3s forward buffer keeps latency low
        backBufferLength: 0,            // no backward buffer
        liveBackBufferLength: 0,        // new viewers always jump to live edge
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        retryCountRef.current = 0;
        console.log('[LiveRoom:Video] ✅ Manifest parsed — snapping to live edge');
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

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('[LiveRoom:Video] HLS fatal error:', data.type, data.details);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Exponential backoff — handles manifestParsingError when stream isn't ready yet
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
            retryCountRef.current += 1;
            console.log(`[LiveRoom:Video] Retrying in ${delay}ms (attempt ${retryCountRef.current})`);
            setTimeout(() => { if (hlsRef.current) hlsRef.current.startLoad(); }, delay);
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
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
  }, [signedPlayback?.hls, broadcastStarted, isHost]);

  // Socket.IO — create connection & join live room
  useEffect(() => {
    if (!joined || !id) return;
    console.log('[LiveRoom:Socket] Creating socket connection to', SOCKET_URL);

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
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

    // Real-time chat messages
    socket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    // Participant join/leave
    socket.on('participant_joined', (data) => {
      setParticipants(prev => {
        if (prev.find(p => p.userId === data.userId)) return prev;
        return [...prev, data];
      });
      setChatMessages(prev => [...prev, { type: 'system', text: `${data.name} joined`, timestamp: new Date() }]);
    });

    socket.on('participant_left', (data) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      if (data.name) {
        setChatMessages(prev => [...prev, { type: 'system', text: `${data.name} left`, timestamp: new Date() }]);
      }
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
    socket.on('emoji_reaction', () => {
      // Could add floating emojis — for now just acknowledge
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
  }, [joined, id, myName, myUserId]);

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
      <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row">
        {/* ── Video Area ── */}
        <div className="flex-1 flex flex-col bg-black min-h-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-gray-800">
            <div className="flex items-center gap-3">
              <button onClick={handleLeave} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-white text-sm font-semibold truncate max-w-[300px]">
                  {sessionInfo?.title || 'Live Session'}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-red-400 text-[10px] font-medium uppercase">Live</span>
                  <span className="text-gray-600 text-[10px]">{participants.length} watching</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowParticipants(!showParticipants); if (!showParticipants) setShowChat(false); }}
                className={`p-2 rounded-lg transition-colors text-sm relative ${showParticipants ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <Users className="w-4 h-4" />
                {raisedHands.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {raisedHands.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setShowChat(!showChat); if (!showChat) setShowParticipants(false); }}
                className={`p-2 rounded-lg transition-colors text-sm ${showChat ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <MessageSquare className="w-4 h-4" />
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
            {isHost ? (
              /* Host panel — never display HLS stream to avoid OBS infinite mirror feedback */
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
              </div>
            ) : (
              /* Guest: HLS player — only active after host starts broadcast */
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
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
          <div className="flex items-center justify-center gap-3 px-4 py-2 bg-[#0a0a0a] border-t border-gray-800">
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
            <button
              onClick={() => handleReaction('👏')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Smile className="w-3.5 h-3.5" /> React
            </button>
          </div>
        </div>

        {/* ── Side Panel (Chat / Participants) ── */}
        {(showChat || showParticipants) && (
          <div className="w-full lg:w-80 flex flex-col bg-[#0f0f0f] border-l border-gray-800 h-64 lg:h-auto">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-white text-sm font-semibold">
                {showParticipants ? `Participants (${participants.length})` : 'Live Chat'}
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
                        <Hand className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
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
                          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-medium flex-shrink-0 mt-0.5">
                            {(msg.senderName || msg.sender?.name || '?')[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-gray-300 text-[11px] font-medium">{msg.senderName || msg.sender?.name}</span>
                              <span className="text-gray-700 text-[9px]">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-gray-400 text-xs break-words">{msg.message || msg.text}</p>
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
    </InstructorLayout>
  );
}
