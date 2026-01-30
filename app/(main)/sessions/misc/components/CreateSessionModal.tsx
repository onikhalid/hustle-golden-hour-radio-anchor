import React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import GradientButton from "@/components/ui/GradientButton";
import {
  createSessionSchema,
  CreateSessionData,
} from "@/lib/types/dashboard.types";
import { useCreateSession } from "../api";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const modalCardClasses =
  "rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-[0_40px_120px_-60px_rgba(5,0,20,0.9)] backdrop-blur-xl";

type CreateSessionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
};

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  refetch,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateSessionData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      start_time: "",
      end_time: "",
      is_manual: true,
      question_limit: 10,
      is_question_generated: true,
    },
  });

  const { mutate: createSession, isPending: isCreatingSession } =
    useCreateSession();

  const handleCreateSession = (data: CreateSessionData) => {
    // Format dates to ISO if needed, though Input type="datetime-local" already gives a format close to it
    // But the payload example has Z at the end, suggesting UTC
    const payload = {
      ...data,
      start_time: new Date(data.start_time).toISOString(),
      end_time: new Date(data.end_time).toISOString(),
    };

    createSession(payload, {
      onSuccess() {
        onClose();
        refetch();
        reset();
      },
      onError(error) {
        console.error("Failed to create session", error);
      },
    });
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
        className={`${modalCardClasses} relative z-10 w-full max-w-lg text-white/90 my-auto`}
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
            New Session
          </span>
          <h2 className="text-xl font-semibold text-white">
            Create a quiz session
          </h2>
          <p className="text-sm text-white/60">
            Set up a new timeframe and constraints for the quiz.
          </p>
        </header>

        <form
          className="space-y-5"
          onSubmit={handleSubmit(handleCreateSession)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
                Start Time
              </label>
              <Input
                type="datetime-local"
                {...register("start_time")}
                className="w-full h-12 rounded-2xl border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-white/40 focus:ring-0"
              />
              {errors.start_time && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.start_time.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
                End Time
              </label>
              <Input
                type="datetime-local"
                {...register("end_time")}
                className="w-full h-12 rounded-2xl border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-white/40 focus:ring-0"
              />
              {errors.end_time && (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.end_time.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
              Question Limit
            </label>
            <Input
              type="number"
              {...register("question_limit", { valueAsNumber: true })}
              className="w-full h-12 rounded-2xl border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-white/40 focus:ring-0"
            />
            {errors.question_limit && (
              <p className="mt-2 text-xs text-rose-300">
                {errors.question_limit.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-white">
                  Manual Mode
                </Label>
                <p className="text-xs text-white/50">
                  Manually control question flow
                </p>
              </div>
              <Controller
                name="is_manual"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-white">
                  Auto-generate Questions
                </Label>
                <p className="text-xs text-white/50">
                  System will pick questions automatically
                </p>
              </div>
              <Controller
                name="is_question_generated"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
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
              disabled={isCreatingSession}
            >
              {isCreatingSession ? "Creating..." : "Create Session"}
            </GradientButton>
          </div>
        </form>
      </div>
    </div>
  );
};
