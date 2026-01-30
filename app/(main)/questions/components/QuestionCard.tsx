import { Question } from "@/lib/types/dashboard.types";
import { Edit } from "lucide-react";
import { CreateQuestionModal } from "./CreateQuestionModal";
import { useState } from "react";

const QuestionCard = ({
  question,
  refetch,
}: {
  question: Question;
  refetch: () => void;
}) => {
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);

  return (
    <div
      key={question.id}
      className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-blue-500/30 hover:bg-white/10"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-mono">
          ID:{question.id}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-white/90 text-lg leading-snug">
              {question.question}
            </h3>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 whitespace-nowrap">
                {question.category || `Category ${question.category}`}
              </div>
              <button
                onClick={() => setUpdateModalOpen(true)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div
              className={`px-3 py-2 rounded-lg border ${question.correct_option === "A" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/60"}`}
            >
              <span className="opacity-50 mr-2">A:</span> {question.option_a}
            </div>
            <div
              className={`px-3 py-2 rounded-lg border ${question.correct_option === "B" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/60"}`}
            >
              <span className="opacity-50 mr-2">B:</span> {question.option_b}
            </div>
            <div
              className={`px-3 py-2 rounded-lg border ${question.correct_option === "C" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/60"}`}
            >
              <span className="opacity-50 mr-2">C:</span> {question.option_c}
            </div>
            <div
              className={`px-3 py-2 rounded-lg border ${question.correct_option === "D" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/60"}`}
            >
              <span className="opacity-50 mr-2">D:</span> {question.option_d}
            </div>
          </div>
        </div>
      </div>

      <CreateQuestionModal
        isOpen={isUpdateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        isEdit={true}
        defaultValues={question}
        refetch={refetch}
      />
    </div>
  );
};

export default QuestionCard;
