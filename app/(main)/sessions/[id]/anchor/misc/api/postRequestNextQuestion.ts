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
    `/api/v1/golden_hour_quiz/sessions/next-question/${id}?X-Company-Code=RFM&X-Secret-Key=3AD9R0RP44`,
  );
  return res.data as NextQuestionResponse;
};
export const useRequestNextQuestion = () => {
  return useMutation({
    mutationFn: (id: string | number) => requestNextQuestion(id),
  });
};
