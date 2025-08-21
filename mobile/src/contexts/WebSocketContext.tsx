import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import Toast from 'react-native-toast-message';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io('http://localhost:5000', {
      auth: {
        userId: user.id
      }
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Mobile WebSocket connected');
      setIsConnected(true);
      
      // Join user room
      newSocket.emit('join-user', user.id);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Mobile WebSocket disconnected');
      setIsConnected(false);
    });

    // Script upload events
    newSocket.on('script-uploaded-user', (data) => {
      console.log('📤 Mobile: Script uploaded:', data);
      addNotification({
        type: 'success',
        title: 'Script Uploaded',
        message: `Script for ${data.studentId} has been uploaded successfully`
      });
      
      // Show toast notification
      Toast.show({
        type: 'success',
        text1: 'Script Uploaded',
        text2: `Script for ${data.studentId} uploaded successfully`
      });
    });

    // OCR completion events
    newSocket.on('script-ocr-completed-user', (data) => {
      console.log('📝 Mobile: OCR completed:', data);
      addNotification({
        type: 'info',
        title: 'OCR Processing Complete',
        message: `OCR processing completed for ${data.studentId}'s script`
      });
      
      // Show toast notification
      Toast.show({
        type: 'info',
        text1: 'OCR Complete',
        text2: `OCR processing completed for ${data.studentId}'s script`
      });
    });

    // Marking completion events
    newSocket.on('script-marking-completed-user', (data) => {
      console.log('✅ Mobile: Marking completed:', data);
      addNotification({
        type: 'success',
        title: 'AI Marking Complete',
        message: `AI marking completed for ${data.studentId}'s script`
      });
      
      // Show toast notification
      Toast.show({
        type: 'success',
        text1: 'AI Marking Complete',
        text2: `AI marking completed for ${data.studentId}'s script`
      });
    });

    // Global events (for all users)
    newSocket.on('script-uploaded', (data) => {
      console.log('📤 Mobile: Global script upload:', data);
    });

    newSocket.on('script-ocr-completed', (data) => {
      console.log('📝 Mobile: Global OCR completed:', data);
    });

    newSocket.on('script-marking-completed', (data) => {
      console.log('✅ Mobile: Global marking completed:', data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10 notifications
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      notifications,
      clearNotifications
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}; 