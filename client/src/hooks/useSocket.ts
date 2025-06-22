import { useState, useEffect, useRef, useCallback } from "react";
import { MessageWithUser } from "@shared/schema";

interface SocketEvents {
  authenticated: (data: { user: any }) => void;
  messageHistory: (data: { messages: MessageWithUser[] }) => void;
  newMessage: (data: { message: MessageWithUser }) => void;
  onlineUsers: (data: { users: any[] }) => void;
  userTyping: (data: { user: { nome: string }, isTyping: boolean }) => void;
  error: (data: { message: string; remainingTime?: number }) => void;
}

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const eventListenersRef = useRef<SocketEvents>({
    authenticated: () => {},
    messageHistory: () => {},
    newMessage: () => {},
    onlineUsers: () => {},
    userTyping: () => {},
    error: () => {},
  });

  const connect = useCallback(() => {
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate with token
      ws.send(JSON.stringify({
        type: 'authenticate',
        token,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'authenticated':
            eventListenersRef.current.authenticated(data);
            break;
          case 'messageHistory':
            setMessages(data.messages);
            eventListenersRef.current.messageHistory(data);
            break;
          case 'newMessage':
            setMessages(prev => [...prev, data.message]);
            eventListenersRef.current.newMessage(data);
            break;
          case 'onlineUsers':
            setOnlineUsers(data.users);
            eventListenersRef.current.onlineUsers(data);
            break;
          case 'userTyping':
            if (data.isTyping) {
              setTypingUsers(prev => new Set(prev).add(data.user.nome));
            } else {
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.user.nome);
                return newSet;
              });
            }
            eventListenersRef.current.userTyping(data);
            break;
          case 'error':
            console.error('Socket error:', data.message);
            eventListenersRef.current.error(data);
            break;
        }
      } catch (error) {
        console.error('Failed to parse socket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);
  }, [token]);

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [token, connect]);

  const sendMessage = useCallback((content: string) => {
    if (socket && socket.readyState === WebSocket.OPEN && content.trim()) {
      socket.send(JSON.stringify({
        type: 'sendMessage',
        content: content.trim(),
      }));
    }
  }, [socket]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'typing',
        isTyping,
      }));

      if (isTyping) {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(false);
        }, 3000);
      }
    }
  }, [socket]);

  const addEventListener = useCallback((event: keyof SocketEvents, handler: any) => {
    eventListenersRef.current[event] = handler;
  }, []);

  return {
    isConnected,
    messages,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTyping,
    addEventListener,
  };
}
