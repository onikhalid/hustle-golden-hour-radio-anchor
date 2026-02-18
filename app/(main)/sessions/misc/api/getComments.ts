import { tokenlessAxios } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

interface PostCommentResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    success: boolean;
    message: string;
    data: {
      id: number;
      phone_number: string;
      comment: string;
      is_published: boolean;
      created_at: string;
    }[];
  };
}
const GetComments = async () => {
  const response = await tokenlessAxios.get<PostCommentResponse>(
    `/api/v1/golden_hour_quiz/comments/list?X-Company-Code=RFM&X-Secret-Key=3AD9R0RP44`,
  );
  return response.data;
};

export const useGetComments = () => {
  return useQuery({
    queryKey: ["comments"],
    queryFn: GetComments,
  });
};
