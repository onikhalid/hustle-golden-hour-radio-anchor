"use client";

import React, { useState } from "react";
import { Loader2, Plus, RefreshCw, HelpCircle } from "lucide-react";
import { useGetQuestions } from "../api";
import { CreateQuestionModal } from "./CreateQuestionModal";
import QuestionCard from "./QuestionCard";

export default function QuestionsSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    data: questions,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetQuestions(currentPage);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <HelpCircle className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quiz Questions</h1>
            <p className="text-sm text-white/60">Manage your question bank</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCreateModalOpen(true)}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <Plus className={`h-4 w-4`} />
            Add Question
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
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400">
            {error instanceof Error
              ? error.message
              : "Failed to fetch questions"}
          </div>
        ) : !questions || questions.results.data.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            No questions found
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-4">
              {questions.results.data.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  refetch={refetch}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="text-sm text-white/40">
                Showing page{" "}
                <span className="text-white/60">{currentPage}</span> of{" "}
                <span className="text-white/60">
                  {Math.ceil((questions.count || 0) / 10)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!questions.previous || isFetching}
                  className="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!questions.next || isFetching}
                  className="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateQuestionModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        isEdit={false}
        refetch={refetch}
      />

      {/* <UpdateQuestionModal
        isOpen={isUpdateModalOpen}
        question={selectedQuestion}
        onClose={() => {
          setUpdateModalOpen(false);
          setSelectedQuestion(null);
        }}
        onSubmit={handleUpdateQuestion}
        isSubmitting={isUpdatingQuestion}
      /> */}
    </div>
  );
}
