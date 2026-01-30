import { apiClient } from "@/lib/api/dashboardApi";
import { Question } from "@/lib/types/dashboard.types";
import { useQuery } from "@tanstack/react-query";

export interface QuestionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    success: boolean;
    message: string;
    data: Question[];
  };
}

export const listQuestions = async (
  page: number = 1,
): Promise<QuestionsResponse> => {
  const response = await apiClient.get<QuestionsResponse>(
    "api/v1/golden_hour_quiz/questions/list",
    {
      params: {
        "X-Company-Code": "RTM",
        "X-Secret-Key": "S92PS48OE3",
        page,
      },
    },
  );
  return response.data;
};

export const useGetQuestions = (page: number = 1) => {
  return useQuery({
    queryKey: ["questions", page],
    queryFn: () => listQuestions(page),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
