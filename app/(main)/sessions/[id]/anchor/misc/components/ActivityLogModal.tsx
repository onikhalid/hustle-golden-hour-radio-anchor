import React from "react";
import { X } from "lucide-react";

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
}

const modalCardClasses =
  "rounded-3xl border border-white/10 bg-[#0b001c] p-6 shadow-xl transition-all";

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-10 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div
        className={`${modalCardClasses} relative z-10 w-full max-w-2xl text-white/90 max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="uppercase tracking-widest text-indigo-400 text-sm">
              Session Activity
            </span>
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 rounded-2xl border border-white/5 bg-black/40 p-5 font-mono text-xs text-white/70">
          {logs.length > 0 ? (
            <ul className="space-y-3">
              {logs.map((entry, index) => (
                <li
                  key={`${entry}-${index}`}
                  className="leading-relaxed border-b border-white/5 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-white/30 mr-3 text-[10px]">
                    {index + 1}.
                  </span>
                  {entry}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-full items-center justify-center text-white/30 flex-col gap-2 min-h-[200px]">
              <span className="text-2xl opacity-20">📝</span>
              <span>Waiting for activity...</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
