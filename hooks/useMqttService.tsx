import { AblyContext, AblyMessage } from "@/contexts/AblyProvider";
import { useParams } from "next/navigation";
import { useContext, useEffect, useCallback, useState, useRef } from "react";

// Hook return types
export interface AblyHookReturn {
  isConnected: boolean;
  sendMessage: (message: any, topic?: string) => Promise<boolean>;
  sendToMultipleTopics: (message: any, topics: string[]) => Promise<boolean[]>;
  broadcastMessage: (message: any, topic: string) => Promise<boolean>;
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
  subscribedTopics: string[];
  // Legacy support
  addMessageListener: (callback: (message: AblyMessage) => void) => void;
  removeMessageListener: (callback: (message: AblyMessage) => void) => void;
}

export interface MultiSendHookReturn {
  sendToMultipleTopics: (message: any, topics: string[]) => Promise<boolean[]>;
  broadcastMessage: (message: any, topic: string) => Promise<boolean>;
  queueMultiSend: (message: any, topics: string[]) => string;
  isConnected: boolean;
  queueLength: number;
  isSending: boolean;
}

// ===== HOOK 1: Main Ably Hook =====
export function useAbly(): AblyHookReturn {
  const context = useContext(AblyContext);
  if (!context) {
    throw new Error("useAbly must be used within an AblyProvider");
  }

  const {
    isConnected,
    client,
    subscribedTopics,
    subscribeToTopic,
    unsubscribeFromTopic,
    addGlobalListener,
    removeGlobalListener,
    addMessageListener,
    removeMessageListener,
    publishToTopic, // Destructure the helper
  } = context;

  // Send message to single topic
  const sendMessage = useCallback(
    async (
      message: any,
      topic: string = "test/topic/local",
    ): Promise<boolean> => {
      if (!client || !isConnected) {
        console.warn("Ably client not connected");
        return false;
      }

      try {
        await Promise.race([
          publishToTopic(topic, message),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout sending message")),
              5000,
            ),
          ),
        ]);
        return true;
      } catch (error) {
        console.error("Failed to send message:", error);
        return false;
      }
    },
    [client, isConnected, publishToTopic],
  );

  // Send message to multiple topics simultaneously
  const sendToMultipleTopics = useCallback(
    async (message: any, topics: string[]): Promise<boolean[]> => {
      if (!client || !isConnected) {
        console.warn("Ably client not connected");
        return new Array(topics.length).fill(false);
      }

      const sendPromises = topics.map(async (topic) => {
        try {
          await Promise.race([
            publishToTopic(topic, message),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error(`Timeout sending message to ${topic}`)),
                5000,
              ),
            ),
          ]);
          return true;
        } catch (error) {
          console.error(`Failed to send message to topic ${topic}:`, error);
          return false;
        }
      });

      return Promise.all(sendPromises);
    },
    [client, isConnected, publishToTopic],
  );

  // Broadcast message with metadata
  const broadcastMessage = useCallback(
    async (message: any, topic: string): Promise<boolean> => {
      const broadcastPayload = {
        ...message,
        _broadcast: true,
        _timestamp: Date.now(),
        _source: "broadcast",
      };

      return sendMessage(broadcastPayload, topic);
    },
    [sendMessage],
  );

  return {
    isConnected,
    sendMessage,
    sendToMultipleTopics,
    broadcastMessage,
    subscribeToTopic,
    unsubscribeFromTopic,
    addGlobalListener,
    removeGlobalListener,
    subscribedTopics,
    // Legacy support
    addMessageListener,
    removeMessageListener,
  };
}

// ===== HOOK 2: Topic-Specific Hook =====
export function useAblyTopic(
  topic: string,
  callback: (message: AblyMessage) => void,
  dependencies: any[] = [],
): void {
  const { subscribeToTopic, unsubscribeFromTopic } = useAbly();

  useEffect(() => {
    if (!topic) return; // Guard against empty topics

    subscribeToTopic(topic, callback);

    return () => {
      unsubscribeFromTopic(topic, callback);
    };
  }, [topic, subscribeToTopic, unsubscribeFromTopic, ...dependencies]);
}

// ===== HOOK 3: Multi-Send Hook =====
export function useAblyMultiSend(): MultiSendHookReturn {
  const { isConnected, sendToMultipleTopics, broadcastMessage } = useAbly();
  const [messageQueue, setMessageQueue] = useState<
    Array<{ id: string; message: any; topics: string[] }>
  >([]);
  const [isSending, setIsSending] = useState(false);
  const queueIdCounter = useRef(0);

  // Queue message for sending when connected
  const queueMultiSend = useCallback(
    (message: any, topics: string[]): string => {
      const id = `queue_${++queueIdCounter.current}`;
      const queueItem = { id, message, topics };

      setMessageQueue((prev) => [...prev, queueItem]);
      return id;
    },
    [],
  );

  // Process queued messages when connection is established
  useEffect(() => {
    if (isConnected && messageQueue.length > 0 && !isSending) {
      setIsSending(true);

      const processQueue = async () => {
        const promises = messageQueue.map(async ({ message, topics }) => {
          try {
            await sendToMultipleTopics(message, topics);
            return true;
          } catch (error) {
            console.error("Failed to send queued message:", error);
            return false;
          }
        });

        await Promise.all(promises);
        setMessageQueue([]);
        setIsSending(false);
      };

      processQueue();
    }
  }, [isConnected, messageQueue, isSending, sendToMultipleTopics]);

  return {
    sendToMultipleTopics,
    broadcastMessage,
    queueMultiSend,
    isConnected,
    queueLength: messageQueue.length,
    isSending,
  };
}

// ///////////////////////////////////////////////////
// ///////////////////////////////////////////////////
// =====            UTILITY HOOKS             ===== //
// ///////////////////////////////////////////////////
// ///////////////////////////////////////////////////

// Hook for managing connection status with callbacks
export function useAblyConnectionStatus(
  onConnect?: () => void,
  onDisconnect?: () => void,
): boolean {
  const { isConnected } = useAbly();
  const prevConnected = useRef(isConnected);

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      onConnect?.();
    } else if (!isConnected && prevConnected.current) {
      onDisconnect?.();
    }
    prevConnected.current = isConnected;
  }, [isConnected, onConnect, onDisconnect]);

  return isConnected;
}

// Hook for topic pattern matching
export function useAblyTopicPattern(
  pattern: RegExp,
  callback: (message: AblyMessage) => void,
  dependencies: any[] = [],
): void {
  const { addGlobalListener, removeGlobalListener } = useAbly();

  useEffect(() => {
    const patternCallback = (message: AblyMessage) => {
      if (pattern.test(message.topic)) {
        callback(message);
      }
    };

    addGlobalListener(patternCallback);

    return () => {
      removeGlobalListener(patternCallback);
    };
  }, [pattern, addGlobalListener, removeGlobalListener, ...dependencies]);
}

// Export all hooks as default
export default {
  useAbly,
  useAblyTopic,
  useAblyMultiSend,
  useAblyConnectionStatus,
  useAblyTopicPattern,
};
