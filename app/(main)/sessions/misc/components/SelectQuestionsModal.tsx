import React, { useState } from "react";
import { Loader2, Search, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useGetQuestions } from "@/app/(main)/questions/api";
import { useAssignQuestion } from "../api";
import { cn } from "@/lib/utils";
import GradientButton from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";

const modalCardClasses =
  "rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-[0_40px_120px_-60px_rgba(5,0,20,0.9)] backdrop-blur-xl";

type SelectQuestionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  questionLimit: number;
  assignedCount: number;
};

export const SelectQuestionsModal: React.FC<SelectQuestionsModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  questionLimit,
  assignedCount,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    data: questionsResponse,
    isLoading: isLoadingQuestions,
    isFetching: isFetchingQuestions,
  } = useGetQuestions(currentPage);
  const { mutate: assignQuestion, isPending: isAssigning } =
    useAssignQuestion();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const questions = questionsResponse?.results.data || [];

  const filteredQuestions = questions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (assignedCount + prev.length >= questionLimit) {
        toast.error("Limit Reached", {
          description:
            "You have reached the maximum number of questions for this session.",
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAssign = () => {
    if (selectedIds.length === 0) return;

    // The API seems to take questions one by one based on the schema,
    // but usually these systems have bulk or we can loop.
    // Given the task, I'll assign them sequentially or just the first selected for now if the API is single-item.
    // Looking at assignQuestionToSession in dashboardApi.ts, it takes AssignQuestionData (session_id, question_id, order_index).

    selectedIds.forEach((questionId, index) => {
      assignQuestion(
        {
          session_id: sessionId,
          question_id: questionId,
          order_index: assignedCount + index + 1,
        },
        {
          onSuccess: (result) => {
            if (index === selectedIds.length - 1) {
              toast.success("Assignment Successful", {
                description: `Successfully assigned ${selectedIds.length} question(s) to the session.`,
              });
              onClose();
              setSelectedIds([]);
            }
          },
          onError: (error) => {
            toast.error("Assignment Failed", {
              description:
                "Failed to assign one or more questions. Please try again.",
            });
          },
        },
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={`${modalCardClasses} relative z-10 w-full max-w-3xl text-white/90 my-auto flex flex-col max-h-[80vh]`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/20"
        >
          Close
        </button>

        <header className="mb-6">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            Assign Questions
          </span>
          <h2 className="text-xl font-semibold text-white">
            Select questions for Session #{sessionId}
          </h2>
          <p className="text-sm text-white/60">
            Selected: {selectedIds.length} / {questionLimit - assignedCount}{" "}
            available slots
          </p>
        </header>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Search questions or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl border-white/10 bg-white/5"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-[300px]">
          {isLoadingQuestions ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-10 text-white/40">
              No questions found matching your search.
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                {filteredQuestions.map((q) => {
                  const isSelected = selectedIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleSelection(q.id)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer",
                        isSelected
                          ? "bg-purple-500/10 border-purple-500/50"
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors",
                          isSelected
                            ? "bg-purple-500 border-purple-500"
                            : "bg-white/5 border-white/20",
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold px-1.5 py-0.5 rounded bg-purple-400/10 border border-purple-400/20">
                            {q.category || "General"}
                          </span>
                        </div>
                        <p className="text-sm text-white leading-relaxed">
                          {q.question}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="text-xs text-white/40">
                  Page <span className="text-white/60">{currentPage}</span> of{" "}
                  <span className="text-white/60">
                    {Math.ceil((questionsResponse?.count || 0) / 10)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={
                      !questionsResponse?.previous || isFetchingQuestions
                    }
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!questionsResponse?.next || isFetchingQuestions}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-white/40 italic">
            {selectedIds.length === 0
              ? "Select questions to assign them"
              : `Ready to assign ${selectedIds.length} questions`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/20"
            >
              Cancel
            </button>
            <GradientButton
              disabled={selectedIds.length === 0 || isAssigning}
              onClick={handleAssign}
              className="px-8 py-2 text-xs font-bold"
              size="sm"
            >
              {isAssigning ? "Assigning..." : "Assign Selected"}
            </GradientButton>
          </div>
        </footer>
      </div>
    </div>
  );
};
