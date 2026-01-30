import { gameAxios } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

const endQuiz = async (id: string | number) => {
  const res = await gameAxios.get(`/quiz/results/${id}`);
  return res.data as EndQuizAPIResponse;
};

export const useEndQuiz = () => {
  return useMutation({
    mutationFn: (id: string | number) => endQuiz(id),
  });
};

interface EndQuizAPIResponse {
  status: string;
  message: string;
  data: QuizEndResults[];
}

interface QuizEndResults {
  question: {
    correct_answer: string;
    assigned_index: number;
    won: boolean;
  };
  user: {
    email: string;
    first_name: string;
    last_name: string;
    answered_in: number;
  } | null;
}
