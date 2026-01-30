"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      theme="dark"
      richColors
      closeButton
      expand={false}
      visibleToasts={3}
      gap={12}
      toastOptions={{
        style: {
          background: "rgba(255, 255, 255, 0.07)",
          color: "rgba(255, 255, 255, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "16px",
          borderRadius: "24px",
          boxShadow: "0 40px 120px -60px rgba(5,0,20,0.9)",
        },
        className: "font-manrope",
        classNames: {
          toast:
            "group relative flex items-center gap-3 p-4 rounded-[24px] bg-white/[0.07] border-white/10 text-white/90 font-manrope backdrop-blur-xl",
          title: "text-base font-semibold !font-manrope text-white",
          description: "text-sm text-white/60",
          actionButton:
            "bg-purple-500 text-white hover:bg-purple-600 h-8 rounded-xl px-3 text-xs font-medium transition-colors",
          cancelButton:
            "bg-white/10 text-white/70 hover:bg-white/20 h-8 rounded-xl px-3 text-xs font-medium border border-white/10 transition-colors",
          closeButton:
            "absolute right-2 top-2 text-white/30 hover:text-white transition-colors",
          error:
            "!bg-rose-500/20 !border-rose-500/30 [&>svg]:text-rose-400 !text-rose-100",
          success:
            "!bg-emerald-500/20 !border-emerald-500/30 [&>svg]:text-emerald-400 !text-emerald-100",
          warning:
            "!bg-amber-500/20 !border-amber-500/30 [&>svg]:text-amber-400 !text-amber-100",
          info: "!bg-blue-500/20 !border-blue-500/30 [&>svg]:text-blue-400 !text-blue-100",
          icon: "!flex-shrink-0",
          content: "flex-1 flex flex-col gap-1",
        },
      }}
      {...props}
    />
  );
}
