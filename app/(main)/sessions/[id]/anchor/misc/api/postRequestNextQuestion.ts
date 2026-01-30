import { gameAxios } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

export interface QuizQuestion {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  category: string;
  question_id: number;
}
interface NextQuestionResponse {
  success: boolean;
  message: string;
  data: {
    question: QuizQuestion;
    question_index: number;
  };
}

const requestNextQuestion = async (id: string | number) => {
  const res = await gameAxios.post(
    `/api/v1/golden_hour_quiz/sessions/next-question/${id}?X-Company-Code=RTM&X-Secret-Key=S92PS48OE3`,
  );
  return res.data as NextQuestionResponse;
};
export const useRequestNextQuestion = () => {
  return useMutation({
    mutationFn: (id: string | number) => requestNextQuestion(id),
  });
};
