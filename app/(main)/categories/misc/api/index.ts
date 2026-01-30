import { apiClient } from "@/lib/api/dashboardApi";
import { ApiResponse } from "@/lib/types/dashboard.types";
import { useMutation } from "@tanstack/react-query";

export async function createCategory(data: {
  name: string;
}): Promise<ApiResponse> {
  try {
    const response = await apiClient.post(
      "/api/v1/golden_hour_quiz/categories/create/",
      data,
      {
        params: {
          "X-Company-Code": "RTM",
          "X-Secret-Key": "S92PS48OE3",
        },
      },
    );
    return {
      success: true,
      data: response.data,
      message: "Category created successfully",
    };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to create category",
    };
  }
}

export const useCreateCategory = () => {
  return useMutation({
    mutationFn: createCategory,
  });
};
