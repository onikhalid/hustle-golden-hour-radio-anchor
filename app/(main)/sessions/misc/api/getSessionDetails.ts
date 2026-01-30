import { getSessionDetails } from "@/lib/api/dashboardApi";
import { useQuery } from "@tanstack/react-query";

export const useGetSessionDetails = (id: string | number) => {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => getSessionDetails(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
