import { apiClient } from "@/lib/api/dashboardApi";
import { ApiResponse } from "@/lib/types/dashboard.types";
import { useMutation } from "@tanstack/react-query";

export async function createCategory(data: {
  name: string;
}): Promise<ApiResponse> {
  try {
    const response = await apiClient.put(
      "/api/v1/golden_hour_quiz/categories/create/",
      data,
      {
        params: {
          "X-Company-Code": "RTM",
          "X-Secret-Key": "S92PS48OE3",
        },
        // headers: {
        //   Authorization: `Bearer ${token || "14bee5e7ef2d5124ee8fd1d1d1840c28f8a29ec1"}`,
        // },
      },
    );
    return {
      success: true,
      data: response.data,
      message: "Question created successfully",
    };
  } catch (error: any) {
    console.error("Error creating question:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to create question",
    };
  }
}

export const useCreateCategory = () => {
  return useMutation({
    mutationFn: createCategory,
  });
};
