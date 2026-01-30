import { createSession } from "@/lib/api/dashboardApi";
import { CreateSessionData } from "@/lib/types/dashboard.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSessionData) => createSession(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
      }
    },
  });
};
