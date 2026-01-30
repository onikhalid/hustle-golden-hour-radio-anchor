"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateQuestionSchema, UpdateQuestionData } from "@/lib/types/dashboard.types";
import { updateQuestion } from "@/lib/api/dashboardApi";
import { Edit, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function UpdateQuestionSection() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateQuestionData>({
    resolver: zodResolver(updateQuestionSchema),
  });

  const mutation = useMutation({
    mutationFn: updateQuestion,
    onSuccess: (data) => {
      if (data.success) {
        reset();
        // Invalidate any related queries if needed
        queryClient.invalidateQueries({ queryKey: ["questions"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      }
    },
  });

  const onSubmit = (data: UpdateQuestionData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30">
          <Edit className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Update Question</h1>
          <p className="text-sm text-white/60">Modify existing question details</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Question ID */}
          <div className="space-y-2">
            <label htmlFor="question_id" className="text-sm font-medium text-white/80">
              Question ID
            </label>
            <input
              id="question_id"
              type="number"
              placeholder="16"
              {...register("question_id", { valueAsNumber: true })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            {errors.question_id && (
              <p className="text-sm text-red-400">{errors.question_id.message}</p>
            )}
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium text-white/80">
              Question Text
            </label>
            <textarea
              id="question"
              rows={3}
              placeholder="What is the capital of France?"
              {...register("question")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
            />
            {errors.question && (
              <p className="text-sm text-red-400">{errors.question.message}</p>
            )}
          </div>

          {/* Correct Option and Category */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="correct_option" className="text-sm font-medium text-white/80">
                Correct Option
              </label>
              <select
                id="correct_option"
                {...register("correct_option")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              >
                <option value="" className="bg-gray-900">Select option</option>
                <option value="A" className="bg-gray-900">A</option>
                <option value="B" className="bg-gray-900">B</option>
                <option value="C" className="bg-gray-900">C</option>
                <option value="D" className="bg-gray-900">D</option>
              </select>
              {errors.correct_option && (
                <p className="text-sm text-red-400">{errors.correct_option.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-white/80">
                Category
              </label>
              <input
                id="category"
                type="text"
                placeholder="Sports"
                {...register("category")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              />
              {errors.category && (
                <p className="text-sm text-red-400">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Question"
            )}
          </button>

          {/* Success/Error Message */}
          {mutation.isSuccess && mutation.data.success && (
            <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {mutation.data.message || "Question updated successfully!"}
            </div>
          )}
          {mutation.isError && (
            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {mutation.error instanceof Error ? mutation.error.message : "Failed to update question"}
            </div>
          )}
          {mutation.isSuccess && !mutation.data.success && (
            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {mutation.data.error || "Failed to update question"}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
