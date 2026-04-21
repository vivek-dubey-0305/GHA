import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import UserSidebar from './UserSidebar';
import { Menu } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/auth.slice';
import { fetchUnreadSummary, incrementUnreadFromNotification } from '../../redux/slices/communication.slice';

const getSocketBaseUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  return apiBase.replace(/\/api\/v1\/?$/, '');
};

export function UserLayout({ children }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);
  const audioContextRef = useRef(null);
  const inboxRefreshTimerRef = useRef(null);
  const socketUrl = useMemo(getSocketBaseUrl, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    dispatch(fetchUnreadSummary());
  }, [dispatch]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return undefined;

    const socket = io(socketUrl, { transports: ['websocket'], withCredentials: true });

    const getAudioContext = () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      return audioContextRef.current;
    };

    const unlockAudio = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);

    const notificationEventNames = new Set([
      'notification:new',
      'new_enrollment',
      'new_review',
      'assignment_submission',
      'assignment_graded',
      'assignment_reported',
      'assignment_moderation_update',
      'discussion_reply',
      'discussion_created',
      'announcement',
      'payout_update',
      'course_published',
      'certificate_issued',
      'live_class_reminder',
      'live_class_started',
      'live_class_invite',
      'doubt_ticket_created',
      'doubt_ticket_accepted',
      'doubt_ticket_resolved',
      'doubt_saturday_session_reminder',
    ]);

    const scheduleInboxRefresh = () => {
      if (inboxRefreshTimerRef.current) {
        clearTimeout(inboxRefreshTimerRef.current);
      }

      inboxRefreshTimerRef.current = setTimeout(() => {
        dispatch(fetchUnreadSummary());
        window.dispatchEvent(new CustomEvent('gha:inbox:refresh'));
        inboxRefreshTimerRef.current = null;
      }, 120);
    };

    const playAlertTone = () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(880, now);
        osc2.frequency.setValueAtTime(1175, now + 0.07);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.07);
        osc1.stop(now + 0.12);
        osc2.stop(now + 0.22);
      } catch {
        // Ignore audio playback failures due to browser autoplay restrictions.
      }
    };

    socket.on('connect', () => {
      socket.emit('join_notifications', { userId, role: 'User' });
    });

    socket.onAny((eventName, payload) => {
      if (!notificationEventNames.has(eventName)) return;

      const normalizedNotification = eventName === 'notification:new'
        ? payload
        : (payload?.notification || null);

      if (normalizedNotification?.type) {
        dispatch(incrementUnreadFromNotification(normalizedNotification));
        window.dispatchEvent(new CustomEvent('gha:notification:new', { detail: normalizedNotification }));
        if (normalizedNotification.type === 'announcement') {
          window.dispatchEvent(new CustomEvent('gha:announcement:new', { detail: normalizedNotification }));
        }
      } else {
        dispatch(incrementUnreadFromNotification({ type: eventName }));
      }

      scheduleInboxRefresh();
      playAlertTone();
    });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      if (inboxRefreshTimerRef.current) {
        clearTimeout(inboxRefreshTimerRef.current);
        inboxRefreshTimerRef.current = null;
      }
      socket.disconnect();
    };
  }, [dispatch, socketUrl, user?._id, user?.id]);

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <UserSidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Main content area */}
      <main
        className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:ml-20 ml-0' : 'ml-0 lg:ml-64'
        }`}
      >
        {/* Mobile header bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#0a0a0a] border-b border-gray-800 px-3 py-3 sm:px-4 flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-bold text-xs">GH</span>
            </div>
            <span className="text-white font-semibold text-sm truncate">Student Portal</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

export default UserLayout;
