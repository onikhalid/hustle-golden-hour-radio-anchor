import { apiClient } from "@/lib/api/dashboardApi";
import { SessionData } from "@/lib/types/dashboard.types";
import { useQuery } from "@tanstack/react-query";

export interface SessionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    success: boolean;
    message: string;
    data: SessionData[];
  };
}

export const listSessions = async (): Promise<SessionsResponse> => {
  const response = await apiClient.get<SessionsResponse>(
    "api/v1/golden_hour_quiz/sessions/list",
    {
      params: {
        "X-Company-Code": "RFM",
        "X-Secret-Key": "3AD9R0RP44",
      },
    },
  );
  return response.data;
};

export const useGetSessions = () => {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
