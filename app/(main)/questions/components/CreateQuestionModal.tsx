import React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import GradientButton from "@/components/ui/GradientButton";
import {
  createQuestionSchema,
  CreateQuestionData,
  Question,
} from "@/lib/types/dashboard.types";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/api/dashboardApi";
import { Loader2 } from "lucide-react";
import { useCreateQuestion, useUpdateQuestion } from "../api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const modalCardClasses =
  "rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-[0_40px_120px_-60px_rgba(5,0,20,0.9)] backdrop-blur-xl";

type CreateQuestionModalProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  isEdit: boolean;
  defaultValues?: Question;
  refetch: () => void;
  // onSubmit: (values: CreateQuestionData) => Promise<void> | void;
};

export const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({
  isOpen,
  onClose,
  isEdit,
  defaultValues,
  refetch,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateQuestionData>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      question: defaultValues?.question || "",
      option_a: defaultValues?.option_a || "",
      option_b: defaultValues?.option_b || "",
      option_c: defaultValues?.option_c || "",
      option_d: defaultValues?.option_d || "",
      correct_option:
        (defaultValues?.correct_option as "A" | "B" | "C" | "D") || "A",
      category: defaultValues?.category || "",
    },
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await listCategories();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch categories");
      }
      return result.data || [];
    },
    enabled: isOpen, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000,
  });
  const { mutate: createQuestion, isPending: isCreatingQuestion } =
    useCreateQuestion();
  const { mutate: updateQuestion, isPending: isUpdatingQuestion } =
    useUpdateQuestion();

  const handleCreateQuestion = (data: CreateQuestionData) => {
    if (isEdit) {
      updateQuestion(
        { ...data, question_id: defaultValues?.id || 0 },
        {
          onSuccess() {
            onClose();
            refetch();
            reset();
          },
          onError(error) {
            console.error("Failed to update question", error);
          },
        },
      );
    } else {
      createQuestion(data, {
        onSuccess() {
          onClose();
          refetch();
          reset();
        },
        onError(error) {
          console.error("Failed to create question", error);
        },
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur overflow-y-auto">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className={`${modalCardClasses} relative z-10 w-full max-w-2xl text-white/90 my-auto`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="cursor-pointer absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/20"
        >
          Close
        </button>

        <header className="flex flex-col gap-2 pr-14 mb-6">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            {isEdit ? "Update Question" : "New Question"}
          </span>
          <h2 className="text-xl font-semibold text-white">
            {isEdit ? "Update your question" : "Add a new question"}
          </h2>
          <p className="text-sm text-white/60">
            {isEdit
              ? "Update the question to be used in quizzes."
              : "Create a new question to be used in quizzes."}
          </p>
        </header>

        <form
          className="space-y-5"
          onSubmit={handleSubmit(handleCreateQuestion)}
        >
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
              Category
            </label>
            {isLoadingCategories ? (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading
                categories...
              </div>
            ) : (
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full h-12 rounded-2xl border-white/15 bg-white/[0.05] text-white focus:border-white/40 focus:ring-0">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.category && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
              Question Text
            </label>
            <Textarea
              {...register("question")}
              rows={3}
              placeholder="What is the capital of..."
              className="w-full rounded-2xl border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:ring-0 resize-none min-h-[100px]"
            />
            {errors.question && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.question.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
                Option A
              </label>
              <Input
                type="text"
                {...register("option_a")}
                className="w-full h-12 rounded-2xl border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:ring-0"
              />
              {errors.option_a && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.option_a.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
                Option B
              </label>
              <Input
                type="text"
                {...register("option_b")}
                className="w-full h-12 rounded-2xl border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:ring-0"
              />
              {errors.option_b && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.option_b.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
                Option C
              </label>
              <Input
                type="text"
                {...register("option_c")}
                className="w-full h-12 rounded-2xl border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:ring-0"
              />
              {errors.option_c && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.option_c.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
                Option D
              </label>
              <Input
                type="text"
                {...register("option_d")}
                className="w-full h-12 rounded-2xl border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:ring-0"
              />
              {errors.option_d && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.option_d.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
              Correct Option
            </label>
            <Controller
              name="correct_option"
              control={control}
              render={({ field }) => (
                <Tabs
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-4 w-full bg-white/[0.05] border border-white/10 p-1 h-12 rounded-2xl">
                    {(["A", "B", "C", "D"] as const).map((option) => (
                      <TabsTrigger
                        key={option}
                        value={option}
                        className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 transition-all cursor-pointer"
                      >
                        {option}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            />
            {errors.correct_option && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.correct_option.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/20"
            >
              Cancel
            </button>
            <GradientButton
              type="submit"
              className="py-3 text-sm font-semibold"
              size="sm"
              disabled={isCreatingQuestion || isUpdatingQuestion}
            >
              {isCreatingQuestion || isUpdatingQuestion
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Question"
                  : "Create Question"}
            </GradientButton>
          </div>
        </form>
      </div>
    </div>
  );
};
