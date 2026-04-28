"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

type RealtimeEvent = 
  | { type: "Ping" }
  | { type: "NewComment", request_id: string, comment: any }
  | { type: "TicketStatusUpdate", request_id: string, status: string }
  | { type: "StatusPulse", request_id: string }
  | { type: "ReadSync", request_id: string }
  | { type: "NewProject", data: { project: any } }
  | { type: "ProjectPermissionUpdate", data: { project_id: string, allowed: boolean } }
  | { type: "ProjectDataUpdate", data: { project_id: string, status: string, dev_url: string, prod_url: string } };

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

    const connect = async () => {
      try {
        // Determine secure/insecure protocol dynamically
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        
        // 1. Get CSRF Token for Ticket Request
        const csrfToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrf_token="))
          ?.split("=")[1];

        // 2. Get a short-lived WS ticket
        const ticketRes = await fetch("/api/ws/ticket", { 
          method: "POST",
          headers: { "X-CSRF-Token": csrfToken || "" },
          credentials: "include" 
        });
        
        if (!ticketRes.ok) throw new Error("Could not get global WS ticket");
        const { ticket } = await ticketRes.json();

        // 3. Connect with ticket directly to 8080 in dev
        const host = window.location.hostname === "localhost" ? "localhost:8080" : window.location.host;
        const wsUrl = `${protocol}//${host}/api/ws?ticket=${ticket}`;
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          setSocket(ws);
          wsRef.current = ws;
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            let eventData: RealtimeEvent | null = null;

            // Omega-Sync: Universal Master Pulse
            if (parsed.type === "StatusPulse" && parsed.data) {
               eventData = { type: "StatusPulse", ...parsed.data };
               window.dispatchEvent(new CustomEvent('global-ticket-update'));
            }

            // Omega-Sync: Read Synchronization Pulse
            if (parsed.type === "ReadSync") {
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
              window.dispatchEvent(new CustomEvent('global-ticket-update'));
            } else if (parsed.type === "NewComment" && parsed.data) {
              eventData = { type: "NewComment", ...parsed.data };
              setUnreadCount(prev => prev + 1);
              
              if (parsed.data.comment?.message?.includes("[SYSTEM]")) {
                window.dispatchEvent(new CustomEvent('global-ticket-update'));
              }
            } else if (parsed.type === "NewProject") {
              eventData = { type: "NewProject", data: parsed.data };
            } else if (parsed.type === "ProjectPermissionUpdate") {
              eventData = { type: "ProjectPermissionUpdate", data: parsed.data };
            } else if (parsed.type === "ProjectDataUpdate") {
              eventData = { type: "ProjectDataUpdate", data: parsed.data };
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
          // Auto-reconnect after 5 seconds
          reconnectTimer = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error("WS Global Setup Error:", err);
        // Retry connection after 10s if ticket fetch or setup fails
        reconnectTimer = setTimeout(connect, 10000);
      }
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
