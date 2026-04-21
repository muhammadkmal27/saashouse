"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

type RealtimeEvent = 
  | { type: "Ping" }
  | { type: "NewComment", request_id: string, comment: any }
  | { type: "TicketStatusUpdate", request_id: string, status: string }
  | { type: "StatusPulse", request_id: string }
  | { type: "ReadSync", request_id: string };

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  lastEvent: RealtimeEvent | null;
  sendMessage: (msg: any) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  unreadCount: 0,
  setUnreadCount: () => {},
  lastEvent: null,
  sendMessage: () => {}
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pathname = usePathname();

  // Determine if we should be connected based on current route
  const isProtectedRoute = pathname.startsWith("/app") || pathname.startsWith("/admin");

  useEffect(() => {
    if (!isProtectedRoute) return;

    // API endpoint now successfully proxied with cookies intact
    fetch("/api/comments/unread")
      .then(res => res.json())
      .then(data => {
        if (data.count !== undefined) {
          setUnreadCount(data.count);
        }
      })
      .catch(err => console.error("Failed to fetch initial unread count:", err));
  }, []);

  const sendMessage = (msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WS SENDING:", msg);
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn("WS not connected, cannot send message");
    }
  };

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      // Backend WebSocket Endpoint via Next.js Proxy
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.host}/api/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setSocket(ws);
        wsRef.current = ws;
      };

      ws.onmessage = (event) => {
        try {
          console.log("WS RAW RECEIVED:", event.data);
          const parsed = JSON.parse(event.data);
          let eventData: RealtimeEvent | null = null;
          console.log("WS PARSED:", parsed);

          // Omega-Sync: Universal Master Pulse
          if (parsed.type === "StatusPulse" && parsed.data) {
             console.log("Omega-Sync: RECEIVED OMEGA PULSE", parsed.data);
             eventData = { type: "StatusPulse", ...parsed.data };
             window.dispatchEvent(new CustomEvent('global-ticket-update'));
          }

          // Omega-Sync: Read Synchronization Pulse
          if (parsed.type === "ReadSync") {
            console.log("Omega-Sync: RECEIVED READ SYNC", parsed.data);
            eventData = { type: "ReadSync", request_id: parsed.data.request_id };
            // Refetch global count
            fetch("/api/comments/unread")
              .then(res => res.json())
              .then(data => {
                if (data.count !== undefined) setUnreadCount(data.count);
              });
            // Update ticket lists
            window.dispatchEvent(new CustomEvent('global-ticket-update'));
          }

          // Rust Serde using tag='type' and content='data'
          if (parsed.type === "TicketStatusUpdate" && parsed.data) {
            eventData = { type: "TicketStatusUpdate", ...parsed.data };
            
            // Diagnostic signal
            console.log("Omega-Sync: Status Signal Received", parsed.data);

            // GLOBAL SIGNAL: Tell everyone to refresh
            window.dispatchEvent(new CustomEvent('global-ticket-update'));
          } else if (parsed.type === "NewComment" && parsed.data) {
            eventData = { type: "NewComment", ...parsed.data };
            setUnreadCount(prev => prev + 1);
            
            // If it's a system message, also trigger global refresh
            if (parsed.data.comment?.message?.includes("[SYSTEM]")) {
              window.dispatchEvent(new CustomEvent('global-ticket-update'));
            }
          } else if (parsed.type === "Ping" || parsed === "Ping") {
            eventData = { type: "Ping" };
          }

          if (eventData) {
            setLastEvent(eventData);
          }
        } catch (e) {
          console.error("WebSocket parsing error:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);
        wsRef.current = null;
        // Auto-reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    if (isProtectedRoute) {
        connect();
    }

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);



  return (
    <SocketContext.Provider value={{ socket, isConnected, unreadCount, setUnreadCount, lastEvent, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
}
