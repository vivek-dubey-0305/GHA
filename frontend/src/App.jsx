import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth, selectInitializingAuth, selectUser } from './redux/slices/auth.slice';
import GHALoader from './components/GHALoader';
import router from './router/router';
import ErrorBoundary from './components/ErrorBoundary';
import {
  fetchLeaderboardSummary,
  markLeaderboardRefreshRequired,
} from './redux/slices/leaderboard.slice';
import { fetchMyStreak, setStreakSummary } from './redux/slices/streak.slice';
import { destroyLeaderboardSocket, getLeaderboardSocket } from './utils/leaderboard.socket';

// Global error handler - catches unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  event.preventDefault();
});

const App = () => {
  const dispatch = useDispatch();
  const initializingAuth = useSelector(selectInitializingAuth);
  const user = useSelector(selectUser);

  useEffect(() => {
    // Initialize authentication state on app load
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    const uid = user?._id || user?.id;
    if (!uid) return;

    const socket = getLeaderboardSocket();

    const onLeaderboardRefreshRequired = () => {
      dispatch(markLeaderboardRefreshRequired());
      dispatch(fetchLeaderboardSummary());
    };

    const onStreakUpdated = (payload) => {
      if (payload?.streak) {
        dispatch(setStreakSummary(payload.streak));
      } else {
        dispatch(fetchMyStreak());
      }

      dispatch(markLeaderboardRefreshRequired());
      dispatch(fetchLeaderboardSummary());
    };

    socket.on('leaderboard:refresh_required', onLeaderboardRefreshRequired);
    socket.on('streak:updated', onStreakUpdated);

    socket.emit('join_notifications', { userId: uid, role: 'User' });
    socket.emit('leaderboard_presence_join', { userId: uid });

    const heartbeatInterval = window.setInterval(() => {
      socket.emit('leaderboard_presence_heartbeat', { userId: uid });
    }, 30000);

    return () => {
      window.clearInterval(heartbeatInterval);
      socket.off('leaderboard:refresh_required', onLeaderboardRefreshRequired);
      socket.off('streak:updated', onStreakUpdated);
      socket.emit('leaderboard_presence_leave', { userId: uid });
      destroyLeaderboardSocket();
    };
  }, [dispatch, user?._id, user?.id]);

  // Show GHA loader while initializing
  if (initializingAuth) {
    return <GHALoader />;
  }

  return (
    <div className="bg-[#080808] text-[#f5f5f0] overflow-x-hidden">
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </div>
  );
};

export default App;