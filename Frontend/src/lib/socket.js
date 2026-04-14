import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_ROOT || 'http://localhost:5000';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(socketUrl, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }

  return socketInstance;
};

export const connectSocket = () => {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (!socketInstance) return;
  socketInstance.removeAllListeners();
  socketInstance.disconnect();
};
