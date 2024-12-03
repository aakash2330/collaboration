"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { WebSocketManager } from "./ws";
import {
  messageFromRedisTypeZod,
  type TmessageTypeZod,
  type TmessageFromRedisTypeZod,
} from "@/validators/messages";

interface WebSocketContextType {
  sendWsMessage: (message: TmessageTypeZod) => void;
  message: TmessageFromRedisTypeZod | undefined;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [message, setMessage] = useState<TmessageFromRedisTypeZod | undefined>(
    undefined,
  );

  useEffect(() => {
    const socket = WebSocketManager.getInstance().ws;
    setWs(socket);

    socket.onmessage = (event) => {
      const parsedMessage = messageFromRedisTypeZod.safeParse(
        JSON.parse(event.data as string),
      );
      if (!parsedMessage.success) {
        console.error(
          "message parsing error" + JSON.stringify(parsedMessage.error),
        );
      }
      setMessage(parsedMessage.data);
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const sendWsMessage = useCallback(
    (message: TmessageTypeZod): void => {
      if (ws) {
        WebSocketManager.getInstance().sendMessage(message);
      }
    },
    [ws],
  );

  return (
    <WebSocketContext.Provider value={{ sendWsMessage, message }}>
      {children}
    </WebSocketContext.Provider>
  );
};
