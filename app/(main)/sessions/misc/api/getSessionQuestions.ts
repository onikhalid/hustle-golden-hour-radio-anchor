import { apiClient, getSessionDetails } from "@/lib/api/dashboardApi";
import { useQuery } from "@tanstack/react-query";

export interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  category: string | null;
  sub_category: string | null;
  used: boolean;
  number_of_uses: number;
  is_active: boolean;
}

export interface SessionQuestion {
  id: number;
  question: Question;
  order_index: number;
  is_answered: boolean;
  winner_purchase_id: number | null;
  answered_at: string | null;
  started_at: string | null;
}

export interface SessionQuestionsResponse {
  success: boolean;
  message: string;
  data: SessionQuestion[];
}
const getSessionQuestions = async (sessionId: string | number) => {
  const response = await apiClient.get(
    `/api/v1/golden_hour_quiz/sessions/questions/${sessionId}`,
    {
      params: {
        "X-Company-Code": "RTM",
        "X-Secret-Key": "S92PS48OE3",
      },
    },
  );
  return response.data as SessionQuestionsResponse;
};
export const useGetSessionQuestions = (id: string | number) => {
  return useQuery({
    queryKey: ["session-questions", id],
    queryFn: () => getSessionQuestions(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
