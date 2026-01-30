"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { weeklyWinnerSchema, WeeklyWinnerData } from "@/lib/types/dashboard.types";
import { createWeeklyWinner } from "@/lib/api/dashboardApi";
import { Calendar, Trophy, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function WeeklyWinnersSection() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WeeklyWinnerData>({
    resolver: zodResolver(weeklyWinnerSchema),
  });

  const mutation = useMutation({
    mutationFn: createWeeklyWinner,
    onSuccess: (data) => {
      if (data.success) {
        reset();
        // Invalidate any related queries if needed
        queryClient.invalidateQueries({ queryKey: ["weekly-winners"] });
      }
    },
  });

  const onSubmit = (data: WeeklyWinnerData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Trophy className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Winners</h1>
          <p className="text-sm text-white/60">Add weekly scratch card winners</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Winner Phone */}
          <div className="space-y-2">
            <label htmlFor="winner_phone" className="text-sm font-medium text-white/80">
              Winner Phone Number
            </label>
            <input
              id="winner_phone"
              type="text"
              placeholder="08067071454"
              {...register("winner_phone")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
            />
            {errors.winner_phone && (
              <p className="text-sm text-red-400">{errors.winner_phone.message}</p>
            )}
          </div>

          {/* Index Number */}
          <div className="space-y-2">
            <label htmlFor="index_number" className="text-sm font-medium text-white/80">
              Index Number
            </label>
            <input
              id="index_number"
              type="text"
              placeholder="59990"
              {...register("index_number")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
            />
            {errors.index_number && (
              <p className="text-sm text-red-400">{errors.index_number.message}</p>
            )}
          </div>

          {/* Week Date */}
          <div className="space-y-2">
            <label htmlFor="week_date" className="text-sm font-medium text-white/80">
              Week Date
            </label>
            <div className="relative">
              <input
                id="week_date"
                type="date"
                {...register("week_date")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
              />
              <Calendar className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>
            {errors.week_date && (
              <p className="text-sm text-red-400">{errors.week_date.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Add Weekly Winner"
            )}
          </button>

          {/* Success/Error Message */}
          {mutation.isSuccess && mutation.data.success && (
            <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {mutation.data.message || "Weekly winner created successfully!"}
            </div>
          )}
          {mutation.isError && (
            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {mutation.error instanceof Error ? mutation.error.message : "Failed to create weekly winner"}
            </div>
          )}
          {mutation.isSuccess && !mutation.data.success && (
            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {mutation.data.error || "Failed to create weekly winner"}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
