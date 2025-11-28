import { MQTTContext, MQTTMessage } from "@/contexts/MQTTProvider";
import { useParams } from "next/navigation";
import { useContext, useEffect, useCallback, useState, useRef } from "react";

// Hook return types
export interface MQTTHookReturn {
  isConnected: boolean;
  sendMessage: (message: any, topic?: string) => Promise<boolean>;
  sendToMultipleTopics: (message: any, topics: string[]) => Promise<boolean[]>;
  broadcastMessage: (message: any, topic: string) => Promise<boolean>;
  subscribeToTopic: (
    topic: string,
    callback: (message: MQTTMessage) => void
  ) => void;
  unsubscribeFromTopic: (
    topic: string,
    callback: (message: MQTTMessage) => void
  ) => void;
  addGlobalListener: (callback: (message: MQTTMessage) => void) => void;
  removeGlobalListener: (callback: (message: MQTTMessage) => void) => void;
  subscribedTopics: string[];
  // Legacy support
  addMessageListener: (callback: (message: MQTTMessage) => void) => void;
  removeMessageListener: (callback: (message: MQTTMessage) => void) => void;
}

export interface MultiSendHookReturn {
  sendToMultipleTopics: (message: any, topics: string[]) => Promise<boolean[]>;
  broadcastMessage: (message: any, topic: string) => Promise<boolean>;
  queueMultiSend: (message: any, topics: string[]) => string;
  isConnected: boolean;
  queueLength: number;
  isSending: boolean;
}

// ===== HOOK 1: Main MQTT Hook =====
export function useMQTT(): MQTTHookReturn {
  const context = useContext(MQTTContext);
  if (!context) {
    throw new Error("useMQTT must be used within an MQTTProvider");
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
  } = context;

  // Send message to single topic (backward compatible)
  const sendMessage = useCallback(
    async (
      message: any,
      topic: string = "test/topic/local"
    ): Promise<boolean> => {
      if (!client || !isConnected) {
        console.warn("MQTT client not connected");
        return false;
      }

      try {
        const messageString = JSON.stringify(message);
        await new Promise<void>((resolve, reject) => {
          client.publish(topic, messageString, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        return true;
      } catch (error) {
        console.error("Failed to send message:", error);
        return false;
      }
    },
    [client, isConnected]
  );

  // Send message to multiple topics simultaneously
  const sendToMultipleTopics = useCallback(
    async (message: any, topics: string[]): Promise<boolean[]> => {
      if (!client || !isConnected) {
        console.warn("MQTT client not connected");
        return new Array(topics.length).fill(false);
      }

      const sendPromises = topics.map(async (topic) => {
        try {
          const messageString = JSON.stringify(message);
          await new Promise<void>((resolve, reject) => {
            client.publish(topic, messageString, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          return true;
        } catch (error) {
          console.error(`Failed to send message to topic ${topic}:`, error);
          return false;
        }
      });

      return Promise.all(sendPromises);
    },
    [client, isConnected]
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
    [sendMessage]
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
export function useMQTTTopic(
  topic: string,
  callback: (message: MQTTMessage) => void,
  dependencies: any[] = []
): void {
  const { subscribeToTopic, unsubscribeFromTopic } = useMQTT();

  useEffect(() => {
    subscribeToTopic(topic, callback);

    return () => {
      unsubscribeFromTopic(topic, callback);
    };
  }, [topic, subscribeToTopic, unsubscribeFromTopic, ...dependencies]);
}

// ===== HOOK 3: Multi-Send Hook =====
export function useMQTTMultiSend(): MultiSendHookReturn {
  const { isConnected, sendToMultipleTopics, broadcastMessage } = useMQTT();
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
    []
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
export function useMQTTConnectionStatus(
  onConnect?: () => void,
  onDisconnect?: () => void
): boolean {
  const { isConnected } = useMQTT();
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
export function useMQTTTopicPattern(
  pattern: RegExp,
  callback: (message: MQTTMessage) => void,
  dependencies: any[] = []
): void {
  const { addGlobalListener, removeGlobalListener } = useMQTT();

  useEffect(() => {
    const patternCallback = (message: MQTTMessage) => {
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
  useMQTT,
  useMQTTTopic,
  useMQTTMultiSend,
  useMQTTConnectionStatus,
  useMQTTTopicPattern,
};
