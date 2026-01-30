import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import GradientButton from "@/components/ui/GradientButton";

const modalCardClasses = "rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-[0_40px_120px_-60px_rgba(5,0,20,0.9)] backdrop-blur-xl";

const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(120, "Name must be 120 characters or fewer"),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

type CreateCategoryModalProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateCategoryFormValues) => Promise<void> | void;
};

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const internalSubmit = async (values: CreateCategoryFormValues) => {
    await onSubmit(values);
    reset();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur">
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
      <div className={`${modalCardClasses} relative z-10 w-full max-w-xl text-white/90`}>
        <button
          type="button"
          onClick={handleClose}
          className="cursor-pointer absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/20"
        >
          Close
        </button>

        <header className="flex flex-col gap-2 pr-14">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">Create Category</span>
          <h2 className="text-xl font-semibold text-white">Spin up a new session</h2>
          <p className="text-sm text-white/60">
            Give the Category a memorable name and a quick pitch. Players will see both.
          </p>
        </header>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(internalSubmit)}>
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-white/50">Name</label>
            <input
              type="text"
              {...register("name")}
              placeholder="Golden Hour Showdown"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none focus:ring-0"
            />
            {errors.name && (
              <p className="mt-2 text-xs text-rose-300">{errors.name.message}</p>
            )}
          </div>

         

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/20"
            >
              Cancel
            </button>
            <GradientButton
              type="submit"
              className="px-6 py-3 text-sm font-semibold"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Category"}
            </GradientButton>
          </div>
        </form>
      </div>
    </div>
  );
};
