"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  ToggleLeft,
  Settings2,
  HelpCircle,
  Plus,
} from "lucide-react";
import { useGetSessionDetails } from "../misc/api";
import { cn } from "@/lib/utils";
import { SelectQuestionsModal } from "../misc/components/SelectQuestionsModal";
import { useGetSessionQuestions } from "../misc/api/getSessionQuestions";

export default function SessionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: result, isLoading, error } = useGetSessionDetails(id as string);
  const session = result?.data;
  const {
    data: questions,
    isLoading: questionsLoading,
    error: questionsError,
  } = useGetSessionQuestions(id as string);
  console.log(questions);
  const [isSelectModalOpen, setSelectModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </button>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          <p>
            {error instanceof Error
              ? error.message
              : "Failed to load session details"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-4">
        <button
          onClick={() => router.back()}
          className="flex w-fit items-center gap-2 text-sm text-white/60 hover:text-white transition mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Calendar className="h-7 w-7 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">
                  Session #{session.id}
                </h1>
                <div
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    session.is_active
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-white/40 border border-white/10",
                  )}
                >
                  {session.is_active ? "Active" : "Inactive"}
                </div>
              </div>
              <p className="text-white/50">
                Created on {new Date(session.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-sm">
              <span className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">
                Status
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  session.is_active ? "text-emerald-400" : "text-white/60",
                )}
              >
                {session.is_active ? "Currently Live" : "Session Closed"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timing Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Duration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <span className="block text-xs uppercase tracking-widest text-white/40 mb-1">
                Start Time
              </span>
              <p className="text-white/90">
                {new Date(session.start_time).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-widest text-white/40 mb-1">
                End Time
              </span>
              <p className="text-white/90">
                {new Date(session.end_time).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Settings2 className="h-5 w-5 text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Configuration</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="block text-xs uppercase tracking-widest text-white/40 mb-1">
                  Manual Mode
                </span>
                <p className="text-white/90">
                  {session.is_manual ? "Enabled" : "Disabled"}
                </p>
              </div>
              <ToggleLeft
                className={cn(
                  "h-6 w-6",
                  session.is_manual ? "text-emerald-400" : "text-white/20",
                )}
              />
            </div>
            <div>
              <span className="block text-xs uppercase tracking-widest text-white/40 mb-1">
                System Generated
              </span>
              <p className="text-white/90">Enabled</p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Layers className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Progress</h2>
          </div>
          <div className="space-y-4">
            <div>
              <span className="block text-xs uppercase tracking-widest text-white/40 mb-1">
                Questions Used
              </span>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-white">
                  {session.current_question_index}
                </p>
                <p className="text-white/40 mb-1">/ {session.question_limit}</p>
              </div>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${(session.current_question_index / session.question_limit) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <HelpCircle className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Assigned Questions</h2>
          </div>

          {session.is_manual && (
            <button
              onClick={() => setSelectModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-400 border border-purple-500/30 transition hover:bg-purple-500/30"
            >
              <Plus className="h-4 w-4" />
              Select Questions
            </button>
          )}
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl">
          {questions && questions.data.length > 0 ? (
            <div className="grid gap-4">
              {questions.data.map((sq) => (
                <div
                  key={sq.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-medium text-white/60">
                      {sq.order_index}
                    </span>
                    <p className="text-sm font-medium text-white/90">
                      {sq.question.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/60">
                      {sq.question.category}
                    </span>
                    {/* <span className="text-xs font-medium text-white/60">{sq.question.used}</span> */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-center">
              No specific questions detailed in session metadata yet.
            </p>
          )}
        </div>
      </section>

      <SelectQuestionsModal
        isOpen={isSelectModalOpen}
        onClose={() => setSelectModalOpen(false)}
        sessionId={session.id}
        questionLimit={questions?.data.length ?? 0}
        assignedCount={session.current_question_index}
      />
    </div>
  );
}
