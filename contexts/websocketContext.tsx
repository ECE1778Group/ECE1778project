import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../constant";

interface WebSocketContextType {
  ws: React.RefObject<WebSocket | null>;
  sendMessage: (data: any) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({} as any);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { loggedIn, isAuthLoading } = useAuth();
  const ws = useRef<WebSocket | null>(null);

  const connect = async () => {
    try {
      // 1. 等待认证完成
      if (isAuthLoading) return;

      // 2. 如果未登录，不连接
      if (!loggedIn) {
        ws.current?.close();
        ws.current = null;
        return;
      }

      // 3. 防止重复连接
      if (ws.current?.readyState === WebSocket.OPEN) return;

      // 4. 获取最新 token
      const token = await AsyncStorage.getItem("access");
      if (!token) {
        console.warn("No token available for WebSocket");
        return;
      }

      // 5. 建立连接
      ws.current = new WebSocket(`${BASE_URL}/chat/?token=${token}`);
      ws.current.onopen = () => console.log("WebSocket connected");
      ws.current.onclose = () => console.log("WebSocket disconnected");
      ws.current.onerror = (e) => console.error("WebSocket error:", e);
      ws.current.onmessage = (event) => {
        // 处理接收的消息
        const data = JSON.parse(event.data);
        console.log("Received:", data);
      };
    } catch (err) {
      console.error("WebSocket connection failed:", err);
    }
  };

  const sendMessage = (data: any): boolean => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  useEffect(() => {
    connect();
  }, [loggedIn, isAuthLoading]);

  useEffect(() => {
    return () => {
      ws.current?.close();
      ws.current = null;
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);