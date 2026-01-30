"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/api/dashboardApi";
import { List, Loader2, Plus, RefreshCw } from "lucide-react";
import { useCreateCategory } from "@/app/(main)/categories/misc/api";
import { CreateCategoryModal } from "./CreateCategoryModal";

export default function CategoriesSection() {
  const {
    data: categories,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await listCategories();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch categories");
      }
      // API returns data in result.data which is already the array
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
  console.log(categories);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { mutate, isPending: isCreatingCategory } = useCreateCategory();
  const handleCreateCategory = (data: { name: string }) => {
    mutate(data, {
      onSuccess() {},
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <List className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quiz Categories</h1>
            <p className="text-sm text-white/60">View all quiz categories</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <Plus className={`h-4 w-4`} />
            Create new
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
            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400">
            {error instanceof Error
              ? error.message
              : "Failed to fetch categories"}
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            No categories found
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-green-500/30 hover:bg-white/10"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <List className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">
                        {category.name}
                      </h3>
                      {category.is_active && (
                        <span
                          className="flex h-2 w-2 rounded-full bg-green-400"
                          title="Active"
                        />
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-white/60 mt-1 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                      <span>ID: {category.id}</span>
                      <span>•</span>
                      <span>
                        {new Date(category.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateCategory}
        isSubmitting={isCreatingCategory}
      />
    </div>
  );
}
