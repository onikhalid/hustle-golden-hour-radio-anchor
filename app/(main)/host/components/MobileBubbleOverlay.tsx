"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMQTT } from "@/hooks/useMqttService";
import { MQTTMessage } from "@/contexts/MQTTProvider";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface CommentBubble {
  id: string;
  user_name: string;
  comment: string;
  timestamp: number;
  type: "comment";
}

interface AnswerBubble {
  id: string;
  contestant_name: string;
  selected_option: string;
  timestamp: number;
  type: "answer";
}

interface PlayerResult {
  user_id: number;
  user_name: string;
  user_phone: string;
  answered_in: number;
  is_correct: boolean;
  is_winner: boolean;
  answer: string;
}

interface Question {
  question_id: number;
  correct_option: string;
}

export interface QuestionTallyResponse {
  status: string;
  message: string;
  data: {
    question: Question;
    results: PlayerResult[];
  };
}

interface LeaderboardOverlay {
  id: string;
  timestamp: number;
  type: "leaderboard";
  results: PlayerResult[];
  question?: Question;
}

type BubbleItem = CommentBubble | AnswerBubble | LeaderboardOverlay;

type ChatFeedType = "golden_hour" | "hustle_tv_show";

interface MobileBubbleOverlayProps {
  className?: string;
  type: ChatFeedType;
  quizId?: string | number;
  maxBubbles?: number;
  bubbleLifespan?: number;
  leaderboardLifespan?: number;
}

const COMMENT_EVENTS_BY_TYPE: Record<ChatFeedType, Set<string>> = {
  hustle_tv_show: new Set(["publish_comment"]),
  golden_hour: new Set(["publish_quiz_comment"]),
};

const ANSWER_EVENTS = new Set([
  "quiz_selected_option",
  "player_selected_option",
]);


const modalCardClasses =
  "rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-[0_40px_120px_-60px_rgba(5,0,20,0.9)] backdrop-blur-xl";

export const MobileBubbleOverlay: React.FC<MobileBubbleOverlayProps> = ({
  className = "",
  type,
  quizId,
  maxBubbles = 5,
  bubbleLifespan = 4000,
  leaderboardLifespan = 6000,
}) => {
  const { addGlobalListener, removeGlobalListener } = useMQTT();
  const { authState } = useAuth();
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardOverlay | null>(
    null
  );
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const activeCommentEvents = COMMENT_EVENTS_BY_TYPE[type];
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [confettiSeed, setConfettiSeed] = useState(0);
  const [isConfettiVisible, setIsConfettiVisible] = useState(false);



  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const confettiPieces = useMemo(() => {
    if (!isConfettiVisible) {
      return [] as Array<{
        id: string;
        left: number;
        delay: number;
        duration: number;
        color: string;
        width: number;
        height: number;
      }>;
    }

    const colors = ["#FDE68A", "#F472B6", "#60A5FA", "#34D399", "#F97316"];

    return Array.from({ length: 40 }, (_, index) => ({
      id: `${confettiSeed}-${index}`,
      left: Math.random() * 100,
      delay: Math.random() * 200,
      duration: 1600 + Math.random() * 900,
      color: colors[index % colors.length],
      width: 6 + Math.random() * 4,
      height: 10 + Math.random() * 6,
    }));
  }, [confettiSeed, isConfettiVisible]);

  const sortedResults = useMemo(() => {
    if (!leaderboard?.results?.length) {
      return [] as PlayerResult[];
    }

    return [...leaderboard.results].sort((a, b) => {
      if (a.is_winner !== b.is_winner) {
        return a.is_winner ? -1 : 1;
      }
      if (a.is_correct !== b.is_correct) {
        return a.is_correct ? -1 : 1;
      }
      return (
        (a.answered_in ?? Number.MAX_SAFE_INTEGER) -
        (b.answered_in ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }, [leaderboard?.results]);

  const winner = useMemo(
    () => sortedResults.find((entry) => entry.is_winner) ?? null,
    [sortedResults]
  );

 
  const correctAnswer = useMemo(() => {
    if (leaderboard?.question?.correct_option) {
      return leaderboard.question.correct_option.toUpperCase();
    }

    const correctEntry = sortedResults.find((entry) => entry.is_correct);
    return correctEntry?.answer ? correctEntry.answer.toUpperCase() : null;
  }, [leaderboard?.question?.correct_option, sortedResults]);

  const hasTallyResults = sortedResults.length > 0;

  const getOptionColor = (option?: string) => {
    switch (option?.toUpperCase()) {
      case "A":
        return "bg-red-500/80 text-white";
      case "B":
        return "bg-blue-500/80 text-white";
      case "C":
        return "bg-green-500/80 text-white";
      case "D":
        return "bg-yellow-500/80 text-black";
      default:
        return "bg-gray-500/80 text-white";
    }
  };

  const removeBubble = useCallback((id: string) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const addBubble = useCallback(
    (bubble: BubbleItem) => {
    

      setBubbles((prev) => {
        const next = [...prev, bubble];
        // Keep only the latest maxBubbles
        if (next.length > maxBubbles) {
          const removed = next.shift();
          if (removed) {
            const timeout = timeoutsRef.current.get(removed.id);
            if (timeout) {
              clearTimeout(timeout);
              timeoutsRef.current.delete(removed.id);
            }
          }
        }
        return next;
      });

      // Schedule removal after lifespan
      const timeout = setTimeout(() => {
        removeBubble(bubble.id);
      }, bubbleLifespan);
      timeoutsRef.current.set(bubble.id, timeout);
    },
    [maxBubbles, bubbleLifespan, leaderboardLifespan, removeBubble]
  );

 
  const unwrapPayload = useCallback((value: any): any => {
    if (!value) return value;
    if (typeof value === "string") return value;

    if (Array.isArray(value)) {
      return value.length > 0 ? unwrapPayload(value[0]) : null;
    }

    if (typeof value === "object") {
      if (value.comment && typeof value.comment === "object") {
        return unwrapPayload(value.comment);
      }
      if (value.data && typeof value.data === "object") {
        const nested = unwrapPayload(value.data);
        if (nested) return nested;
      }
      if (value.payload && typeof value.payload === "object") {
        const nested = unwrapPayload(value.payload);
        if (nested) return nested;
      }
    }

    return value;
  }, []);

  const handleMQTTMessage = useCallback(
    (message: MQTTMessage) => {
      const eventType = message.event ?? message.payload?.event;
      if (!eventType) return;

      const payload =
        message.payload?.data ??
        message.payload?.payload ??
        message.payload ??
        message;
      const data = payload?.data ?? payload;

      // Handle comment events
      if (activeCommentEvents?.has(eventType)) {
        const rawComment = data?.comment;
        const commentPayload =
          rawComment && typeof rawComment === "object" ? rawComment : data;
        const source = unwrapPayload(commentPayload);

        if (source) {
          const user = source.user ?? source.author ?? source.profile ?? {};
          const user_name = String(
            source.user_name ??
              source.contestant_name ??
              source.userName ??
              user.name ??
              user.full_name ??
              "Anonymous"
          );
          const commentText =
            source.comment ??
            source.message ??
            source.text ??
            source.body ??
            source.content ??
            "";

          if (commentText) {
            addBubble({
              id: `comment-${Date.now()}-${Math.random()}`,
              user_name,
              comment: String(commentText),
              timestamp: Date.now(),
              type: "comment",
            });
          }
        }
        return;
      }

      // Handle answer events
      if (ANSWER_EVENTS.has(eventType)) {
        if (!data) return;

        const contestant_name = String(
          data.user_name ?? data.contestant_name ?? data.userName ?? "Player"
        );
        const selected_option = String(
          data.selected_option ?? data.answer ?? ""
        );

        if (selected_option) {
          addBubble({
            id: `answer-${Date.now()}-${Math.random()}`,
            contestant_name,
            selected_option,
            timestamp: Date.now(),
            type: "answer",
          });
        }
        return;
      }
    },
    [activeCommentEvents, addBubble, unwrapPayload]
  );

  useEffect(() => {
    addGlobalListener(handleMQTTMessage);
    return () => removeGlobalListener(handleMQTTMessage);
  }, [addGlobalListener, removeGlobalListener, handleMQTTMessage]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden z-10",
        className
      )}
    >
      {/* Bubbles Container - positioned near stream (top-left) */}
      <div className="absolute top-3 left-3 right-20 flex flex-col gap-1.5">
        {bubbles.map((bubble, index) => (
          <div
            key={bubble.id}
            className={cn(
              "animate-bubble-in transition-all duration-300",
              "backdrop-blur-sm rounded-full px-2.5 py-1 max-w-[70%] shadow-[0_6px_18px_rgba(0,0,0,0.25)]",
              bubble.type === "comment"
                ? "bg-black/60"
                : "bg-gradient-to-r from-purple-600/80 to-blue-600/80"
            )}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {bubble.type === "comment" ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-[0.5rem] font-bold shrink-0">
                  {getInitials((bubble as CommentBubble).user_name)}
                </div>
                <p className="text-white text-[0.55rem] truncate leading-tight">
                  <span className="font-medium">
                    {(bubble as CommentBubble).user_name}
                  </span>
                  : {(bubble as CommentBubble).comment}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[0.55rem] font-bold shrink-0",
                    getOptionColor((bubble as AnswerBubble).selected_option)
                  )}
                >
                  {(bubble as AnswerBubble).selected_option?.toUpperCase()}
                </div>
                <p className="text-white text-[0.55rem] truncate leading-tight">
                  <span className="font-medium">
                    {(bubble as AnswerBubble).contestant_name}
                  </span>{" "}
                  answered
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leaderboard Modal Overlay */}
      {leaderboard && showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur">
          <div
            className="absolute inset-0"
            // onClick={() => setLeaderboard(null)}
            aria-hidden="true"
          ></div>

          <div
            className={cn(
              "relative inset-0  z-10 w-full max-w-3xl text-white/90",
              modalCardClasses
            )}
          >
           

            <h3 className="text-white font-bold text-center mb-3 flex items-center justify-center gap-2">
              🏆 Leaderboard
            </h3>

            <div className="mt-6 max-h-[320px] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03]">
              <table className="w-full text-left text-xs text-white/80">
                <thead className="sticky top-0 bg-white/[0.04] text-[11px] uppercase tracking-[0.2em] text-white/40">
                  <tr>
                    <th className="px-4 py-3">Contestant</th>
                    <th className="px-4 py-3">Answer</th>
                    <th className="px-4 py-3">Correct?</th>
                    <th className="px-4 py-3">Winner</th>
                    <th className="px-4 py-3 text-right">Time (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.length > 0 ? (
                    sortedResults.map((entry) => {
                      const name =
                        entry.user_name ||
                        entry.user_phone ||
                        `Player ${entry.user_id}`;
                      return (
                        <tr
                          key={`${entry.user_id}-${entry.answer}`}
                          className={`${
                            entry.is_winner
                              ? "bg-emerald-500/10 text-emerald-100"
                              : "odd:bg-white/[0.02]"
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-semibold">
                            {name}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {entry.answer || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {entry.is_correct ? (
                              <span className="text-emerald-300">Yes</span>
                            ) : (
                              <span className="text-rose-300">No</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {entry.is_winner ? (
                              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                                Winner
                              </span>
                            ) : (
                              ""
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-white/70">
                            {entry.answered_in ?? "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-white/50"
                      >
                        No answers recorded for this round yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileBubbleOverlay;
