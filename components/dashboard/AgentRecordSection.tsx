"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agentRecordSchema, AgentRecordData } from "@/lib/types/dashboard.types";
import { createAgentRecord } from "@/lib/api/dashboardApi";
import { UserPlus, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AgentRecordSection() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgentRecordData>({
    resolver: zodResolver(agentRecordSchema),
  });

  const mutation = useMutation({
    mutationFn: createAgentRecord,
    onSuccess: (data) => {
      if (data.success) {
        reset();
        // Invalidate any related queries if needed
        queryClient.invalidateQueries({ queryKey: ["agent-records"] });
      }
    },
  });

  const onSubmit = (data: AgentRecordData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
          <UserPlus className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Records</h1>
          <p className="text-sm text-white/60">Create new agent records</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* First Name and Last Name */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="first_name" className="text-sm font-medium text-white/80">
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                placeholder="Victor"
                {...register("first_name")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {errors.first_name && (
                <p className="text-sm text-red-400">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="last_name" className="text-sm font-medium text-white/80">
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                placeholder="Azubike"
                {...register("last_name")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {errors.last_name && (
                <p className="text-sm text-red-400">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white/80">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="oduvictor@gmail.com"
                {...register("email")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-white/80">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                placeholder="09087678709"
                {...register("phone")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {errors.phone && (
                <p className="text-sm text-red-400">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium text-white/80">
              Address
            </label>
            <input
              id="address"
              type="text"
              placeholder="shomolu yaba, lagos"
              {...register("address")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
            {errors.address && (
              <p className="text-sm text-red-400">{errors.address.message}</p>
            )}
          </div>

          {/* User ID and UUID */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="user_id" className="text-sm font-medium text-white/80">
                User ID
              </label>
              <input
                id="user_id"
                type="text"
                placeholder="120"
                {...register("user_id")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {errors.user_id && (
                <p className="text-sm text-red-400">{errors.user_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="user_uuid" className="text-sm font-medium text-white/80">
                User UUID
              </label>
              <input
                id="user_uuid"
                type="text"
                placeholder="34e08db3-de90-430c-879b-30f41c9d97a2"
                {...register("user_uuid")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {errors.user_uuid && (
                <p className="text-sm text-red-400">{errors.user_uuid.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Agent Record"
            )}
          </button>

          {/* Success/Error Message */}
          {mutation.isSuccess && mutation.data.success && (
            <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {mutation.data.message || "Agent record created successfully!"}
            </div>
          )}
          {mutation.isError && (
            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {mutation.error instanceof Error ? mutation.error.message : "Failed to create agent record"}
            </div>
          )}
          {mutation.isSuccess && !mutation.data.success && (
            <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {mutation.data.error || "Failed to create agent record"}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
