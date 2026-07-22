import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';

type SocketContextType = {
  socket: Socket | null;
  connected: boolean;
};

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    // Resolve Socket.IO server URL cleanly across dev and production environments
    const getSocketUrl = () => {
      if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
      }
      if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) {
        return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
      }
      if (import.meta.env.DEV) {
        return import.meta.env.VITE_PROXY_TARGET || 'http://localhost:3000';
      }
      return 'https://hindustaan-os-backend.onrender.com';
    };

    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ['polling', 'websocket'], // Standard Socket.IO v4 order: start with HTTP polling for handshake sid, then cleanly upgrade to WebSocket
      reconnection: true,
      reconnectionAttempts: 15, // Limit attempts to prevent infinite console spam if server is down
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      // Join a general room for dashboard updates
      newSocket.emit('join_room', 'dashboard_updates');
      
      if (user?.id) {
        newSocket.emit('join_room', `user_${user.id}`);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message);
      setConnected(false);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
