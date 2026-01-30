import React, { useState } from "react";
import { X, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { QuizQuestion } from "../api/postRequestNextQuestion";
import { useLockAnswer } from "../api/quizHostApi";
import { StatusBadge } from "./StatusBadge";

interface LockAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuizQuestion | null;
}

const modalCardClasses =
  "rounded-3xl border border-white/10 bg-[#0b001c] p-8 shadow-xl transition-all";

export const LockAnswerModal: React.FC<LockAnswerModalProps> = ({
  isOpen,
  onClose,
  question,
}) => {
  const [ticketId, setTicketId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const lockAnswerMutation = useLockAnswer();

  const resetForm = () => {
    setTicketId("");
    setPhoneNumber("");
    setStatus("idle");
    setErrorMessage("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    setStatus("idle");
    setErrorMessage("");

    try {
      await lockAnswerMutation.mutateAsync({
        phone_number: phoneNumber,
        question_id: question.question_id,
        ticket_purchase_id: ticketId,
      });
      setStatus("success");
      // Optional: Close automatically after success? keeping open for now so they see confirmation
    } catch (error: any) {
      console.error("Failed to lock answer:", error);
      setStatus("error");
      setErrorMessage(
        error?.response?.data?.message ||
          "Failed to lock answer. Please try again.",
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-10 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      ></div>
      <div
        className={`${modalCardClasses} relative z-10 w-full max-w-lg text-white/90 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Lock size={20} />
            </div>
            <span>Lock User Answer</span>
          </h3>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!question ? (
          <div className="text-center py-8 text-white/50">
            No active question selected.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Question Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <StatusBadge
                label="Question ID"
                value={String(question.question_id)}
                tone="accent"
              />
              <p className="text-sm font-medium text-white/90 line-clamp-2">
                {question.question}
              </p>
            </div>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">
                    Answer Locked!
                  </h4>
                  <p className="text-sm text-white/60">
                    The user has been successfully locked in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-4 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Lock another user
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50 pl-1">
                      Ticket Purchase ID
                    </label>
                    <input
                      type="text"
                      required
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      placeholder="e.g. QZ-4F6DA57DBA"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/50 pl-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 08167168616"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                {status === "error" && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-3">
                    <AlertCircle
                      className="shrink-0 text-red-400 mt-0.5"
                      size={16}
                    />
                    <p className="text-xs text-red-200/90 leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={lockAnswerMutation.isPending}
                    className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {lockAnswerMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Locking Answer...</span>
                      </>
                    ) : (
                      "Lock User Answer"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
