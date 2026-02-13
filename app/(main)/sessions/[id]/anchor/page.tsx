"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Lock, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

import { useRequestNextQuestion } from "./misc/api";
import {
  useStartQuizGame,
  useStartQuestionTime,
  useRetrieveQuiz,
  useElapseQuestionTime,
  useStopQuizBroadcast,
  useStartAnchorSession,
} from "./misc/api/quizHostApi";
import { getQuestionResultsTally } from "./misc/api/quizHostApi";
import type { QuestionTallyResponse } from "./misc/api/quizHostApi";

import { useAbly, useAblyTopic, useAblyPresence } from "@/hooks/useMqttService";
import { StatusBadge } from "./misc/components/StatusBadge";
import { DataGrid, DataPoint } from "./misc/components/DataGrid";
import { TallyModal } from "./misc/components/TallyModal";
import { ActivityLogModal } from "./misc/components/ActivityLogModal";
import { LockAnswerModal } from "./misc/components/LockAnswerModal";
import { useEndQuiz } from "./misc/api";
import { useQueryClient } from "@tanstack/react-query";
import { QuizQuestion } from "./misc/api/postRequestNextQuestion";
import { useGetSessionDetails } from "../../misc/api";
import { useGetComments } from "../../misc/api/getComments";

const cardBase =
  "rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3.5 md:p-5";

type ControlButton = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "accent" | "danger" | "neutral";
  description?: string;
};

const controlButtonBase =
  "flex flex-col justify-center rounded-lg md:rounded-2xl cursor-pointer px-2 py-1.5 md:px-4 md:py-3 text-left text-sm font-semibold transition duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-50 h-full relative overflow-hidden";

const controlVariants: Record<NonNullable<ControlButton["variant"]>, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-400 hover:to-blue-400",
  accent:
    "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400",
  danger:
    "bg-gradient-to-r from-rose-600 to-red-500 text-white hover:from-rose-500 hover:to-red-400",
  neutral: "bg-white/10 text-white hover:bg-white/20",
};

const ConnectionOverlay = ({
  isConnected,
  onStartSession,
  loading,
}: {
  isConnected: boolean;
  onStartSession: () => void;
  loading: boolean;
}) => {
  if (isConnected) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b001c]/90 backdrop-blur-md">
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
          <StatusBadge
            label=""
            value="Offline"
            tone="danger"
            className="scale-150"
          />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-white">
          Connection Required
        </h2>
        <p className="mb-8 text-white/60">
          You must start a session to connect to Ably before you can control the
          quiz.
        </p>
        <button
          onClick={onStartSession}
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Starting Session..." : "Start Session"}
        </button>
      </div>
    </div>
  );
};

const AnchorSessionPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [timer, setTimer] = useState<number>(10);
  const [timerRunning, setTimerRunning] = useState(false);
  const [correctOption, setCorrectOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [roundTally, setRoundTally] = useState<
    QuestionTallyResponse["data"] | null
  >(null);
  const [isTallyModalOpen, setIsTallyModalOpen] = useState(false);

  // New state for modals
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isLockAnswerOpen, setIsLockAnswerOpen] = useState(false);

  // Comments state
  const { data: commentsData, isLoading: loadingComments } = useGetComments();
  const [comments, setComments] = useState<
    {
      id: number;
      phone_number: string;
      comment: string;
      is_published: boolean;
      created_at: string;
    }[]
  >([]);

  // Sync initial comments
  useEffect(() => {
    if (commentsData?.results?.data) {
      setComments(commentsData.results.data);
    }
  }, [commentsData]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const processingEndRef = useRef(false); // Ref to prevent double execution of handleEndTimer
  const handleEndTimerRef = useRef<(() => Promise<void>) | null>(null); // Prevent stale closures

  const { isConnected, sendMessage } = useAbly();
  const queryClient = useQueryClient();

  // Only subscribe to the topic if we are connected (have a valid token)
  const topic = isConnected ? `publish/question/session/${id}` : "";
  const commentTopic = isConnected ? `publish/comment/${id}` : "";
  const answerTopic = isConnected ? `answer/question/session/${id}` : "";
  const presenceTopic = isConnected ? `publish/question/session/${id}` : "";

  // Presence
  const presentMembers = useAblyPresence(presenceTopic);

  useEffect(() => {
    console.log("⚓ AnchorPage: Presence topic:", presenceTopic);
    console.log("⚓ AnchorPage: Present members updated:", presentMembers);
  }, [presenceTopic, presentMembers]);

  // Answers State
  const [answers, setAnswers] = useState<
    {
      id: number;
      phone_number: string;
      selected_option: string;
      timestamp: number;
    }[]
  >([]);

  useAblyTopic(
    answerTopic,
    (message) => {
      if (
        message.event === "Answer Question" ||
        message.name === "Answer Question"
      ) {
        let payload = message.payload || message.data;
        // Check if payload is a string and parse it (based on user's example)
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (e) {
            console.error("Failed to parse answer payload", e);
            return;
          }
        }

        const newAnswer = {
          id: Date.now(),
          phone_number: payload.phone_number,
          selected_option: payload.selected_option,
          timestamp: Date.now(),
        };

        setAnswers((prev) => [newAnswer, ...prev]);
        addLog(`Answer received: ${payload.phone_number}`);
      }
    },
    [answerTopic],
  );

  useAblyTopic(
    topic,
    (message) => {
      console.log("Receiving session message:", message);
    },
    [topic],
  );

  useAblyTopic(
    commentTopic,
    (message) => {
      // Check for event type in message.event (or message.name as fallback if needed, but user log shows event)
      if (
        message.event === "publish-comment" ||
        message.name === "publish-comment"
      ) {
        const payload = message.payload || message.data;

        // Payload format: { session_id, phone_number, comment, comment_id }
        const newComment = {
          id: payload.comment_id || Date.now(),
          phone_number: payload.phone_number,
          comment: payload.comment,
          is_published: true,
          created_at: new Date().toISOString(),
        };

        setComments((prev) => [newComment, ...prev]);
        addLog(`New comment: ${payload.comment?.substring(0, 20)}...`);
      }
    },
    [commentTopic],
  );

  // API hooks
  const startQuiz = useStartQuizGame();
  const requestQuestion = useRequestNextQuestion();
  const startQTime = useStartQuestionTime();
  const elapseQTime = useElapseQuestionTime();
  const startSession = useStartAnchorSession();
  const {
    data: quizData,
    isLoading: loadingQuiz,
    refetch: refetchSession,
  } = useGetSessionDetails(id as string);

  // Helper: log events
  const addLog = (msg: string) => setLog((prev) => [msg, ...prev.slice(0, 29)]);

  const handleStartSession = async () => {
    setLoading(true);
    try {
      const res = await startSession.mutateAsync(id);
      const token = res.data?.ably_connect_data?.token;
      const sessionId = res.data?.game_data?.session_id;

      addLog(`Session started successfully. ID: ${sessionId}`);

      if (token) {
        sessionStorage.setItem("ably_auth_token", token);
        queryClient.setQueryData(["ably-token"], token);
        addLog("Ably token synced and persisted. Connecting...");
      } else {
        addLog("Warning: No Ably token found in response.");
      }
    } catch (error) {
      addLog("Failed to start session.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Start quiz
  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      await startQuiz.mutateAsync(id);
      addLog(`Quiz started: ID ${id}`);
    } catch {
      addLog("Failed to start quiz");
    }
    setLoading(false);
  };

  const [activeAction, setActiveAction] = useState<string | null>(null);

  // ... existing state ...

  // Request next question and send to player
  const handleSendQuestion = async () => {
    setLoading(true);
    setActiveAction("send_question");
    setCorrectOption(null);
    setRoundTally(null);
    setIsTallyModalOpen(false);
    try {
      requestQuestion.mutateAsync(id, {
        onSuccess: async (data) => {
          if (!data) {
            addLog("Error: Could not retrieve next question data.");
            return;
          }

          const q = data.data.question;
          const qIndex = data.data.question_index;

          if (!q) {
            addLog(`Error: Question data is missing.`);
            return;
          }

          setQuestion(q);
          setQuestionIndex(qIndex);
          const payload = {
            event: "quest",
            data: data,
          };
          await sendMessage(payload, topic);
          addLog(`Sent question ${qIndex} to players.`);
        },
      });

      // Structure for player using raw data from response
    } catch (e) {
      addLog("Failed to fetch/send next question");
      console.error(e);
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  // Start timer and notify players
  const handleStartTimer = async () => {
    if (!question) return;
    setActiveAction("start_timer");

    if (timerRef.current) clearInterval(timerRef.current);

    const startCountdown = () => {
      const duration = 10;
      setTimer(duration);
      setTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimerRunning(false);
            if (handleEndTimerRef.current) {
              handleEndTimerRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    await startQTime.mutateAsync(question.question_id, {
      onSuccess: async () => {
        await sendMessage(
          {
            event: "timer_start",
            data: { seconds_allowed: 10 },
          },
          topic,
        );
        startCountdown();
        addLog("Timer started (10s)");
        processingEndRef.current = false;
        setActiveAction(null);
      },
      onError: async () => {
        addLog("Timer start failed, sending timer event manually");
        handleEndTimer();
        processingEndRef.current = false;
        setActiveAction(null);
      },
    });
  };

  // End timer, send correct option, and tally
  const handleEndTimer = async () => {
    if (!question || processingEndRef.current) return;
    processingEndRef.current = true;
    setLoading(true);
    // Note: We don't set activeAction here because this is often called automatically/internally

    try {
      // Race the API call against a 5-second timeout to prevent valid network hangs from locking UI
      const timeElapsePromise = elapseQTime.mutateAsync(question.question_id);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000),
      );

      await Promise.race([timeElapsePromise, timeoutPromise]);
      addLog("Question time elapsed.");

      const tallyRes = await getQuestionResultsTally(question.question_id);
      const correct = tallyRes?.data?.question?.correct_option || null;
      setCorrectOption(correct);
      setRoundTally(tallyRes.data);
      setIsTallyModalOpen(true);
      await sendMessage(
        {
          event: "timer_end",
          data: { question: { correct_option: correct } },
        },
        topic,
      );
      addLog(`Timer ended. Correct: ${correct || "?"}`);
      setTimerRunning(false);
      await sendMessage(
        { event: "leaderboard_update", data: tallyRes.data },
        topic,
      );
      addLog("Tally sent.");
    } catch {
      addLog("Failed to get/send tally.");
    } finally {
      setTimerRunning(false);
      setLoading(false);
      processingEndRef.current = false;
      // Extra safety: clear interval again to prevent double-firing
      if (timerRef.current) clearInterval(timerRef.current);
      // Double check safety: ensure timer is stopped after a short delay
      setTimeout(() => {
        setTimerRunning(false);
        setLoading(false);
      }, 500);
    }
  };

  useEffect(() => {
    handleEndTimerRef.current = handleEndTimer;
  }, [handleEndTimer]);

  const handleManualTally = async () => {
    if (!question) return;
    setLoading(true);
    setActiveAction("manual_tally");
    try {
      if (timerRunning) {
        await elapseQTime.mutateAsync(question.question_id);
        addLog("Question time elapsed (manual).");
      }

      const tallyRes = await getQuestionResultsTally(question.question_id);
      await sendMessage(
        { event: "leaderboard_update", data: tallyRes.data },
        topic,
      );
      addLog("Manual tally sent.");
      setRoundTally(tallyRes.data);
      setIsTallyModalOpen(true);
    } catch {
      addLog("Manual tally failed.");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  // End entire quiz session
  const { mutate: endQuizMutate } = useEndQuiz();
  const handleEndQuiz = async () => {
    setLoading(true);
    setActiveAction("end_quiz");
    try {
      await sendMessage({ event: "quiz_session_end" }, topic);
      addLog("Quiz session end signal sent.");
      endQuizMutate(id);
      setIsTallyModalOpen(false);
      setRoundTally(null);
    } catch {
      addLog("Failed to send session end.");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const controlButtons: ControlButton[] = [
    {
      label:
        activeAction === "send_question"
          ? "Sending question..."
          : "Send next question",
      onClick: handleSendQuestion,
      disabled: loading || timerRunning,
      variant: "primary",
      description: timerRunning
        ? "Wait for timer to finish"
        : "Push the next prompt",
    },
    {
      label:
        activeAction === "start_timer" ? "Starting timer..." : "Start timer",
      onClick: handleStartTimer,
      disabled: loading || !question || timerRunning,
      variant: "accent",
      description: question ? "Countdown for answers" : "Load a question first",
    },
    {
      label:
        activeAction === "manual_tally" ? "Sending tally..." : "Send tally now",
      onClick: handleManualTally,
      disabled: loading || !question,
      variant: "neutral",
      description: "Refresh the leaderboard",
    },
    {
      label: activeAction === "end_quiz" ? "Ending quiz..." : "End quiz",
      onClick: handleEndQuiz,
      disabled: loading,
      variant: "danger",
      description: "Wrap up and share results",
    },
  ].filter(Boolean) as ControlButton[];

  const renderControlButton = (button: ControlButton) => {
    const variant: NonNullable<ControlButton["variant"]> =
      button.variant ?? "primary";
    return (
      <button
        key={button.label}
        type="button"
        onClick={button.onClick}
        disabled={button.disabled}
        className={`${controlButtonBase} ${controlVariants[variant]}`}
      >
        <span className="text-sm md:text-base">{button.label}</span>
        {button.description && (
          <span className="mt-1 hidden text-[0.65rem] font-normal text-white/75 md:block">
            {button.description}
          </span>
        )}
      </button>
    );
  };

  if (loadingQuiz) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b001c]">
        <span className="animate-pulse text-sm text-white/60">
          Loading quiz…
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 md:gap-6 p-3 md:py-8 sm:px-6 lg:px-10">
        <header className="rounded-3xl border border-white/10 bg-white/[0.05] p-3 md:px-5 md:py5 shadow-[0_40px_80px_-60px_rgba(15,0,38,0.9)] backdrop-blur">
          <div className="flex md:flex-col justify-between gap-4 md:gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex md:flex-col items-center md:items-start gap-4">
              <Link
                href={`/sessions/${id}`}
                className="flex p-2 md:px-4 md:py-2 items-center justify-center w-max rounded-full border border-white/10 bg-white/10 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/20"
              >
                <ChevronLeft className="inline size-3 lg:size-5 md:mr-1 md:-ml-1" />
                <span className="max-md:hidden">Back to sessions</span>
              </Link>
              <div>
                <h1 className="sm:text-2xl md:text-3xl font-semibold text-white/90 truncate ">
                  {/* {quizData?.data?.id || `Session ${id}`} */}
                  Session {id}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 md:gap-3 shrink-0">
              <StatusBadge
                label="Ably"
                value={isConnected ? "Online" : "Offline"}
                tone={isConnected ? "success" : "danger"}
              />
              <StatusBadge
                label="Players"
                value={presentMembers.length.toString()}
                tone="default"
              />
              {timerRunning && (
                <StatusBadge label="Timer" value={`${timer}s`} tone="accent" />
              )}
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-4 md:space-y-6">
            <section className={`${cardBase} flex flex-col gap-2.5 md:gap-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                  Question feed
                </h2>
                {question && (
                  <span className="rounded-full bg-indigo-500/20 px-4 py-1 text-xs font-semibold text-indigo-200">
                    Q{questionIndex}
                  </span>
                )}
              </div>

              {question ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-white/90">
                    {question.question}
                  </p>
                  <div className="grid gap-2 grid-cols-2">
                    {["option_a", "option_b", "option_c", "option_d"].map(
                      (key, idx) => {
                        const optionKey = key as keyof typeof question;
                        const label = String.fromCharCode(65 + idx);
                        const isCorrect = correctOption === label;
                        return (
                          <div
                            key={optionKey as string | number}
                            className={`rounded-2xl border px-4 py-3 text-xs sm:text-sm font-medium transition ${
                              isCorrect
                                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
                                : "border-white/10 bg-white/[0.03] text-white/80"
                            }`}
                          >
                            <span className="mr-2 text-xs font-semibold tracking-[0.3em] text-white/50">
                              {label}.
                            </span>
                            {question[optionKey]}
                          </div>
                        );
                      },
                    )}
                  </div>
                  {correctOption && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200">
                      Option {correctOption} locked in as the correct answer.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/50">
                  <span>No active question yet.</span>
                  <span>Use “Send next question” to load the next prompt.</span>
                </div>
              )}

              <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
                {controlButtons.map(renderControlButton)}
              </div>

              {/* Timer Moved Here */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Timer
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-3xl font-semibold text-white/90">
                    {timerRunning ? timer : "00"}
                  </span>
                  <span className="text-[11px] text-white/40">seconds</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full transition-[width] ease-linear rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 "
                    style={{
                      width: `${Math.max(0, Math.min(timer, 10)) * 10}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Live Answers Section ADDED */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-4 h-[300px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                    Live Answers
                  </p>
                  <div className="bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full">
                    {answers.length}
                  </div>
                </div>

                {answers.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-center p-4">
                    <p className="text-sm text-white/40">
                      Waiting for answers...
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {answers.map((answer) => (
                      <div
                        key={answer.id}
                        className="rounded-xl bg-white/[0.03] p-3 border border-white/5 flex justify-between items-center"
                      >
                        <span className="text-xs text-white/80 font-mono">
                          {answer.phone_number}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-400">
                            Option {answer.selected_option}
                          </span>
                          <span className="text-[10px] text-white/30">
                            {new Date(answer.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4 md:space-y-6">
            {quizData?.data?.is_manual && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3">
                  Manual Actions
                </p>
                <button
                  onClick={() => setIsLockAnswerOpen(true)}
                  disabled={!question}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/30 text-orange-400 py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock size={16} />
                  <span>Lock Answer</span>
                </button>
              </div>
            )}

            {/* Moved Activity Log trigger here */}
            <button
              onClick={() => setIsActivityLogOpen(true)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between hover:bg-white/[0.05] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white transition-colors">
                  <FileText size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white/80">
                    Activity Log
                  </p>
                  <p className="text-[10px] text-white/40">
                    {log.length} events recorded
                  </p>
                </div>
              </div>
            </button>

            {/* Session Info REMOVED */}

            {/* Comments Section ADDED */}
            <div
              className={`${cardBase} flex flex-col gap-4 h-[400px] md:h-[500px]`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Comments
                </h2>
                <div className="bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full">
                  {comments.length}
                </div>
              </div>

              {loadingComments ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="animate-spin text-white/30" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-center p-4">
                  <p className="text-sm text-white/40">
                    No comments yet. Waiting for interaction...
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl bg-white/[0.03] p-3 border border-white/5"
                    >
                      <p className="text-sm text-white/90 mb-1">
                        {comment.comment}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/40">
                          {comment.phone_number}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {new Date(comment.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      <TallyModal
        isOpen={isTallyModalOpen && !!roundTally}
        onClose={() => {
          setIsTallyModalOpen(false);
          // Safety breaker: Force reset loading/timer states when modal is closed manually
          setLoading(false);
          setTimerRunning(false);
          processingEndRef.current = false;
        }}
        questionIndex={questionIndex}
        questionText={question?.question ?? null}
        tallyData={roundTally}
      />

      {/* New Modals */}
      <ActivityLogModal
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        logs={log}
      />

      <LockAnswerModal
        isOpen={isLockAnswerOpen}
        onClose={() => setIsLockAnswerOpen(false)}
        question={question}
      />

      <ConnectionOverlay
        isConnected={isConnected}
        onStartSession={handleStartSession}
        loading={loading}
      />
    </div>
  );
};

export default AnchorSessionPage;
