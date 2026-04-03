import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let leaderboardSocket = null;

export const getLeaderboardSocket = () => {
  if (leaderboardSocket) return leaderboardSocket;

  leaderboardSocket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket'],
  });

  return leaderboardSocket;
};

export const destroyLeaderboardSocket = () => {
  if (!leaderboardSocket) return;
  leaderboardSocket.disconnect();
  leaderboardSocket = null;
};
