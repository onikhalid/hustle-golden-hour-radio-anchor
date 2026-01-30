import { assignQuestionToSession } from "@/lib/api/dashboardApi";
import { AssignQuestionData } from "@/lib/types/dashboard.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAssignQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignQuestionData) => assignQuestionToSession(data),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate both questions and the specific session to ensure data is fresh
        queryClient.invalidateQueries({ queryKey: ["questions"] });
        queryClient.invalidateQueries({
          queryKey: ["session", variables.session_id.toString()],
        });
      }
    },
  });
};
