"use client";
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import Ably from "ably";
import { useQuery } from "@tanstack/react-query";
import { tokenlessAxios } from "@/lib/axios";

export interface AblyMessage {
  name?: string;
  topic: string;
  event?: string;
  data?: any;
  payload: any;
  timestamp: number;
}

export interface AblyContextProps {
  isConnected: boolean;
  client: any | null;
  topicListeners: { [topic: string]: Array<(message: AblyMessage) => void> };
  globalListeners: Array<(message: AblyMessage) => void>;
  subscribedTopics: string[];
  subscribeToTopic: (
    topic: string,
    callback: (message: AblyMessage) => void,
  ) => void;
  unsubscribeFromTopic: (
    topic: string,
    callback: (message: AblyMessage) => void,
  ) => void;
  addGlobalListener: (callback: (message: AblyMessage) => void) => void;
  removeGlobalListener: (callback: (message: AblyMessage) => void) => void;
  // Publishing helpers
  publishToTopic: (
    topic: string,
    payload: any,
    event?: string,
  ) => Promise<void>;
  publishToMultipleTopics: (
    topics: string[],
    payload: any,
    event?: string,
  ) => Promise<void[]>;
  // Presence helpers
  enterPresence: (topic: string, data?: any) => Promise<any>;
  leavePresence: (topic: string) => Promise<any>;
  getPresence: (topic: string) => Promise<any[]>;
  subscribePresence: (
    topic: string,
    callback: (presenceMessage: any) => void,
  ) => void;
  unsubscribePresence: (
    topic: string,
    callback: (presenceMessage: any) => void,
  ) => void;
  // Push helper (delegates to server API)
  sendPushNotification: (payload: any) => Promise<any>;
  // Legacy support
  addMessageListener: (callback: (message: AblyMessage) => void) => void;
  removeMessageListener: (callback: (message: AblyMessage) => void) => void;
}

export const AblyContext = createContext<AblyContextProps | null>(null);

interface AblyProviderProps {
  children: ReactNode;
  enableGlobalWildcard?: boolean;
}

export function AblyProvider({
  children,
  enableGlobalWildcard = false,
}: AblyProviderProps) {
  // Fetch Ably token using react-query and sessionStorage
  const {
    data: ablyToken,
    isLoading: ablyTokenLoading,
    error: ablyTokenError,
  } = useQuery({
    queryKey: ["ably-token"],
    queryFn: async () => {
      // Look for token in session storage if not provided manually
      const storedToken = sessionStorage.getItem("ably_auth_token");
      if (storedToken) return storedToken;
      return null;
    },
    staleTime: Infinity, // Manual sync will update this
    retry: false,
  });
  const configuredTopicsRef = useRef<string[]>(
    (process.env.NEXT_PUBLIC_Ably_TOPICS || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  );

  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<any | null>(null);
  const topicListenersRef = useRef<{
    [topic: string]: Array<(message: AblyMessage) => void>;
  }>({});
  const globalListenersRef = useRef<Array<(message: AblyMessage) => void>>([]);
  const subscribedTopicsRef = useRef<string[]>([]);
  const channelWrapperRef = useRef<{ [topic: string]: any }>({});
  const channelMessageWrapperRef = useRef<{
    [topic: string]: (msg: any) => void;
  }>({});
  const presenceSubsRef = useRef<{ [topic: string]: Array<(m: any) => void> }>(
    {},
  );

  // Initialize Ably
  useEffect(() => {
    if (!ablyToken || ablyTokenLoading || ablyTokenError) return;
    const client = new Ably.Realtime({ token: ablyToken });
    client.connection.on("connected", () => {
      setIsConnected(true);
    });
    client.connection.on("failed", () => {
      setIsConnected(false);
    });
    client.connection.on("disconnected", () => {
      setIsConnected(false);
    });
    clientRef.current = client;
    return () => {
      try {
        client.close();
      } catch (e) {
        /* ignore */
      }
      clientRef.current = null;
    };
  }, [ablyToken, ablyTokenLoading, ablyTokenError]);

  const ensureChannel = useCallback((topic: string) => {
    if (!clientRef.current || !topic) return null;
    if (!channelWrapperRef.current[topic]) {
      channelWrapperRef.current[topic] = clientRef.current.channels.get(topic);
    }
    return channelWrapperRef.current[topic];
  }, []);

  const processAblyMessage = useCallback((topic: string, msg: any) => {
    const message: AblyMessage = {
      topic,
      event: msg.name,
      payload: msg.data,
      timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
    };

    const topicCallbacks = topicListenersRef.current[topic] || [];
    topicCallbacks.forEach((cb) => cb(message));
    globalListenersRef.current.forEach((cb) => cb(message));
  }, []);

  const subscribeToConfiguredTopics = useCallback(() => {
    if (!clientRef.current) return;
    configuredTopicsRef.current.forEach((t) => {
      if (!subscribedTopicsRef.current.includes(t)) {
        const ch = ensureChannel(t);
        if (!ch) return;
        const wrapper = (msg: any) => processAblyMessage(t, msg);
        ch.subscribe(wrapper);
        channelMessageWrapperRef.current[t] = wrapper;
        subscribedTopicsRef.current.push(t);
      }
    });
  }, [ensureChannel, processAblyMessage]);

  // Subscription API
  const subscribeToTopic = useCallback(
    (topic: string, callback: (message: AblyMessage) => void) => {
      if (!topic) return;
      if (!topicListenersRef.current[topic])
        topicListenersRef.current[topic] = [];
      topicListenersRef.current[topic].push(callback);

      if (!subscribedTopicsRef.current.includes(topic)) {
        const ch = ensureChannel(topic);
        if (!ch) {
          console.warn(`Ably client not ready for subscribing to ${topic}`);
          return;
        }
        const wrapper = (msg: any) => processAblyMessage(topic, msg);
        ch.subscribe(wrapper);
        channelMessageWrapperRef.current[topic] = wrapper;
        subscribedTopicsRef.current.push(topic);
      }
    },
    [ensureChannel, processAblyMessage],
  );

  const unsubscribeFromTopic = useCallback(
    (topic: string, callback: (message: AblyMessage) => void) => {
      const arr = topicListenersRef.current[topic];
      if (!arr) return;
      const idx = arr.indexOf(callback);
      if (idx > -1) arr.splice(idx, 1);
      if (arr.length === 0) {
        const ch = channelWrapperRef.current[topic];
        const wrapper = channelMessageWrapperRef.current[topic];
        if (ch && wrapper) ch.unsubscribe(wrapper);
        subscribedTopicsRef.current = subscribedTopicsRef.current.filter(
          (t) => t !== topic,
        );
        delete topicListenersRef.current[topic];
        delete channelMessageWrapperRef.current[topic];
        delete channelWrapperRef.current[topic];
      }
    },
    [],
  );

  const addGlobalListener = useCallback(
    (cb: (message: AblyMessage) => void) => {
      globalListenersRef.current.push(cb);
      if (isConnected) subscribeToConfiguredTopics();
    },
    [isConnected, subscribeToConfiguredTopics],
  );

  const removeGlobalListener = useCallback(
    (cb: (message: AblyMessage) => void) => {
      const idx = globalListenersRef.current.indexOf(cb);
      if (idx > -1) globalListenersRef.current.splice(idx, 1);
    },
    [],
  );

  // Publishing
  const publishToTopic = useCallback(
    async (topic: string, payload: any, event?: string) => {
      const ch = ensureChannel(topic);
      if (!ch) throw new Error("Ably client not ready");
      return new Promise<void>((resolve, reject) => {
        ch.publish(event || "message", payload, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
    [ensureChannel],
  );

  const publishToMultipleTopics = useCallback(
    async (topics: string[], payload: any, event?: string) => {
      return Promise.all(
        topics.map((t) => publishToTopic(t, payload, event).catch((e) => e)),
      );
    },
    [publishToTopic],
  );

  // Presence
  const enterPresence = useCallback(
    async (topic: string, data?: any) => {
      const ch = ensureChannel(topic);
      if (!ch) throw new Error("Ably client not ready");
      try {
        if (ch.presence && ch.presence.enter) {
          return ch.presence.enter(data);
        }
      } catch (e) {
        return Promise.reject(e);
      }
    },
    [ensureChannel],
  );

  const leavePresence = useCallback(
    async (topic: string) => {
      const ch = ensureChannel(topic);
      if (!ch) throw new Error("Ably client not ready");
      try {
        if (ch.presence && ch.presence.leave) {
          return ch.presence.leave();
        }
      } catch (e) {
        return Promise.reject(e);
      }
    },
    [ensureChannel],
  );

  const getPresence = useCallback(
    async (topic: string) => {
      const ch = ensureChannel(topic);
      if (!ch) return [];
      return new Promise<any[]>((resolve, reject) => {
        if (!ch.presence || !ch.presence.get) return resolve([]);
        ch.presence.get((err: any, members: any[]) => {
          if (err) reject(err);
          else resolve(members || []);
        });
      });
    },
    [ensureChannel],
  );

  const subscribePresence = useCallback(
    (topic: string, callback: (m: any) => void) => {
      const ch = ensureChannel(topic);
      if (!ch) return;
      if (!presenceSubsRef.current[topic]) presenceSubsRef.current[topic] = [];
      const wrapper = (m: any) => callback(m);
      presenceSubsRef.current[topic].push(wrapper);
      ch.presence.subscribe(wrapper);
    },
    [ensureChannel],
  );

  const unsubscribePresence = useCallback(
    (topic: string, callback: (m: any) => void) => {
      const subs = presenceSubsRef.current[topic];
      if (!subs) return;
      const idx = subs.indexOf(callback as any);
      if (idx > -1) subs.splice(idx, 1);
      const ch = channelWrapperRef.current[topic];
      if (ch) ch.presence.unsubscribe(callback as any);
    },
    [],
  );

  // Push notifications: delegate to serverless API route that calls Ably REST push
  const sendPushNotification = useCallback(async (payload: any) => {
    try {
      const res = await fetch("/api/ably/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    } catch (e) {
      console.error("Failed to send push via server API", e);
      throw e;
    }
  }, []);

  // Legacy support methods
  const addMessageListener = useCallback(
    (cb: (message: AblyMessage) => void) => addGlobalListener(cb),
    [addGlobalListener],
  );
  const removeMessageListener = useCallback(
    (cb: (message: AblyMessage) => void) => removeGlobalListener(cb),
    [removeGlobalListener],
  );

  // If enabled, subscribe configured topics on connect
  useEffect(() => {
    if (isConnected) {
      if (enableGlobalWildcard) {
        // Ably does not support wildcard channel subscriptions; fall back to configured topics
        subscribeToConfiguredTopics();
      } else {
        subscribeToConfiguredTopics();
      }
    }
  }, [isConnected, enableGlobalWildcard, subscribeToConfiguredTopics]);

  const contextValue: AblyContextProps = {
    isConnected,
    client: clientRef.current,
    topicListeners: topicListenersRef.current,
    globalListeners: globalListenersRef.current,
    subscribedTopics: subscribedTopicsRef.current,
    subscribeToTopic,
    unsubscribeFromTopic,
    addGlobalListener,
    removeGlobalListener,
    publishToTopic,
    publishToMultipleTopics,
    enterPresence,
    leavePresence,
    getPresence,
    subscribePresence,
    unsubscribePresence,
    sendPushNotification,
    addMessageListener,
    removeMessageListener,
  };

  return (
    <AblyContext.Provider value={contextValue}>{children}</AblyContext.Provider>
  );
}
