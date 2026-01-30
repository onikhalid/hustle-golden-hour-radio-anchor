"use client";

import React, { useState } from "react";
import { Loader2, Plus, RefreshCw, Calendar } from "lucide-react";
import { useGetSessions } from "./misc/api";
import { CreateSessionModal } from "./misc/components/CreateSessionModal";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SessionsPage() {
  const {
    data: sessions,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetSessions();

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Calendar className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quiz Sessions</h1>
            <p className="text-sm text-white/60">
              Manage and create quiz sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCreateModalOpen(true)}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <Plus className={`h-4 w-4`} />
            Create Session
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400">
            {error instanceof Error
              ? error.message
              : "Failed to fetch sessions"}
          </div>
        ) : !sessions || sessions.results.data.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            No sessions found
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {sessions.results.data.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06] hover:border-white/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Session #{session.id}
                    </span>
                    <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                      {new Date(session.start_time).toLocaleString()}
                    </h3>
                    <p className="text-xs text-white/50">
                      Ends: {new Date(session.end_time).toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      session.is_active
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-white/40 border border-white/10",
                    )}
                  >
                    {session.is_active ? "Active" : "Inactive"}
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-white/30">
                      Questions
                    </span>
                    <span className="text-sm font-semibold text-white/80">
                      {session.current_question_index} /{" "}
                      {session.question_limit}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-white/30">
                      Mode
                    </span>
                    <span className="text-sm font-semibold text-white/80">
                      {session.is_manual ? "Manual" : "Auto"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        refetch={refetch}
      />
    </div>
  );
}
