"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { WS_BASE_URL, type Notification } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

type RealtimeStatus = "connecting" | "connected" | "disconnected" | "error";
type RealtimeHandler<T = unknown> = (payload: T) => void;

type RealtimeContextValue = {
  status: RealtimeStatus;
  mailVersion: number;
  notificationVersion: number;
  lastNotification: Notification | null;
  emit: (event: string, payload?: unknown) => void;
  on: <T = unknown>(event: string, handler: RealtimeHandler<T>) => void;
  off: <T = unknown>(event: string, handler: RealtimeHandler<T>) => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtime() {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error("useRealtime must be used inside RealtimeProvider.");
  }

  return context;
}

export function RealtimeProvider({
  children,
  token,
}: {
  children: ReactNode;
  token: string;
}) {
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [mailVersion, setMailVersion] = useState(0);
  const [notificationVersion, setNotificationVersion] = useState(0);
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const socket = io(`${WS_BASE_URL}/realtime`, {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));
    socket.on("connection.error", () => setStatus("error"));
    socket.on("notification.created", (payload: Notification) => {
      setLastNotification(payload);
      setNotificationVersion((version) => version + 1);
      toast({
        title: payload.title || "New notification",
        description: payload.body ?? undefined,
        variant: "info",
      });
    });
    socket.on("internal_mail.received", (payload: { subject?: string }) => {
      setMailVersion((version) => version + 1);
      toast({
        title: "New internal mail",
        description: payload.subject,
        variant: "info",
      });
    });
    socket.on("internal_mail.updated", () => {
      setMailVersion((version) => version + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [toast, token]);

  const emit = useCallback((event: string, payload?: unknown) => {
    socketRef.current?.emit(event, payload);
  }, []);

  const on = useCallback(<T = unknown,>(event: string, handler: RealtimeHandler<T>) => {
    socketRef.current?.on(event, handler as (...args: unknown[]) => void);
  }, []);

  const off = useCallback(<T = unknown,>(event: string, handler: RealtimeHandler<T>) => {
    socketRef.current?.off(event, handler as (...args: unknown[]) => void);
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      status,
      mailVersion,
      notificationVersion,
      lastNotification,
      emit,
      on,
      off,
    }),
    [emit, lastNotification, mailVersion, notificationVersion, off, on, status],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
