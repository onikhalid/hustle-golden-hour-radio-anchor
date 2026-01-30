"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignQuestionSchema, AssignQuestionData } from "@/lib/types/dashboard.types";
import { assignQuestionToSession } from "@/lib/api/dashboardApi";
import { Link2, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AssignQuestionSection() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignQuestionData>({
    resolver: zodResolver(assignQuestionSchema),
  });

  const mutation = useMutation({
    mutationFn: assignQuestionToSession,
    onSuccess: (data) => {
      if (data.success) {
        reset();
        // Invalidate any related queries if needed
        queryClient.invalidateQueries({ queryKey: ["session-questions"] });
      }
    },
  });

  const onSubmit = (data: AssignQuestionData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
          <Link2 className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Assign Question</h1>
          <p className="text-sm text-white/60">Assign a question to a session</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Session ID and Question ID */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="session_id" className="text-sm font-medium text-white/80">
                Session ID
              </label>
              <input
                id="session_id"
                type="number"
                placeholder="3"
                {...register("session_id", { valueAsNumber: true })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
              {errors.session_id && (
                <p className="text-sm text-red-400">{errors.session_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="question_id" className="text-sm font-medium text-white/80">
                Question ID
              </label>
              <input
                id="question_id"
                type="number"
                placeholder="15"
                {...register("question_id", { valueAsNumber: true })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
              {errors.question_id && (
                <p className="text-sm text-red-400">{errors.question_id.message}</p>
              )}
            </div>
          </div>

          {/* Order Index (Optional) */}
          <div className="space-y-2">
            <label htmlFor="order_index" className="text-sm font-medium text-white/80">
              Order Index <span className="text-white/40">(Optional)</span>
            </label>
            <input
              id="order_index"
              type="number"
              placeholder="1"
              {...register("order_index", { valueAsNumber: true })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
            />
            {errors.order_index && (
              <p className="text-sm text-red-400">{errors.order_index.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Question to Session"
            )}
          </button>

          {/* Success/Error Message */}
          {mutation.isSuccess && mutation.data.success && (
            <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {mutation.data.message || "Question assigned successfully!"}
            </div>
          )}
          {mutation.isError && (
            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {mutation.error instanceof Error ? mutation.error.message : "Failed to assign question"}
            </div>
          )}
          {mutation.isSuccess && !mutation.data.success && (
            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {mutation.data.error || "Failed to assign question"}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
