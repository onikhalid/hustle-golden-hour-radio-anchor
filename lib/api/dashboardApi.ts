import axios from "axios";
import {
  WeeklyWinnerData,
  AgentRecordData,
  ApiResponse,
  AssignQuestionData,
  UpdateQuestionData,
  CategoryData,
  Question,
  CreateQuestionData,
  CreateSessionData,
  SessionData,
} from "../types/dashboard.types";
import { tokenStorage } from "../tokens";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const token = tokenStorage.getToken();

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
    Authorization: token ? `Bearer ${token}` : "",
  },
});

/**
 * Submit weekly winner data
 */
export async function createWeeklyWinner(
  data: WeeklyWinnerData,
): Promise<ApiResponse> {
  try {
    const response = await apiClient.post(
      "/api/v1/scratch_card/weekly-winners/",
      data,
    );
    return {
      success: true,
      data: response.data,
      message: "Weekly winner created successfully",
    };
  } catch (error: any) {
    console.error("Error creating weekly winner:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to create weekly winner",
    };
  }
}

/**
 * Create agent record
 */
export async function createAgentRecord(
  data: AgentRecordData,
): Promise<ApiResponse> {
  try {
    const response = await apiClient.post("/agent/api/create_agent/", data);
    return {
      success: true,
      data: response.data,
      message: "Agent record created successfully",
    };
  } catch (error: any) {
    console.error("Error creating agent record:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to create agent record",
    };
  }
}

/**
 * List quiz categories
 **/
export async function listCategories(): Promise<ApiResponse<CategoryData[]>> {
  try {
    const response = await apiClient.get(
      "/api/v1/golden_hour_quiz/categories/list/",
      {
        params: {
          "X-Company-Code": "RTM",
          "X-Secret-Key": "S92PS48OE3",
        },
        headers: {
          Authorization: `Bearer ${token || "14bee5e7ef2d5124ee8fd1d1d1840c28f8a29ec1"}`,
        },
      },
    );
    // API returns {success, message, data: [...]}
    // We need to extract the array from response.data.data
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message || "Categories fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch categories",
    };
  }
}

/**
 * Assign a question to a session
 */
export async function assignQuestionToSession(
  data: AssignQuestionData,
): Promise<ApiResponse> {
  try {
    const response = await apiClient.post(
      "/api/v1/golden_hour_quiz/sessions/assign-question/",
      data,
      {
        params: {
          "X-Company-Code": "RTM",
          "X-Secret-Key": "S92PS48OE3",
        },
        headers: {
          Authorization: `Bearer ${token || "14bee5e7ef2d5124ee8fd1d1d1840c28f8a29ec1"}`,
        },
      },
    );
    return {
      success: true,
      data: response.data,
      message: "Question assigned successfully",
    };
  } catch (error: any) {
    console.error("Error assigning question:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to assign question",
    };
  }
}

/**
 * Update a question
 */
export async function updateQuestion(
  data: UpdateQuestionData,
): Promise<ApiResponse> {
  try {
    const response = await apiClient.put(
      "/api/v1/golden_hour_quiz/sessions/update-question/",
      data,
      {
        params: {
          "X-Company-Code": "RTM",
          "X-Secret-Key": "S92PS48OE3",
        },
        headers: {
          Authorization: `Bearer ${token || "14bee5e7ef2d5124ee8fd1d1d1840c28f8a29ec1"}`,
        },
      },
    );
    return {
      success: true,
      data: response.data,
      message: "Question updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating question:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to update question",
    };
  }
}

/**
 * List all questions
 */
export async function listQuestions(): Promise<ApiResponse<Question[]>> {
  try {
    const response = await apiClient.get(
      "/api/v1/golden_hour_quiz/questions/list/",
      {
        params: {
          "X-Company-Code": "RTM",
          "X-Secret-Key": "S92PS48OE3",
        },
        headers: {
          Authorization: `Bearer ${token || "14bee5e7ef2d5124ee8fd1d1d1840c28f8a29ec1"}`,
        },
      },
    );
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message || "Questions fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch questions",
    };
  }
}

/**
 * Create a new question
 */
export async function createQuestion(
  data: CreateQuestionData,
): Promise<ApiResponse> {
  try {
    const response = await apiClient.post(
      "/api/v1/golden_hour_quiz/questions/create/",
      data,
      {
        params: {
          "X-Company-Code": "RTM",
          "X-Secret-Key": "S92PS48OE3",
        },
        headers: {
          Authorization: `Bearer ${token || "14bee5e7ef2d5124ee8fd1d1d1840c28f8a29ec1"}`,
        },
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
/**
 * Create a new quiz session
 */
export async function createSession(
  data: CreateSessionData,
): Promise<ApiResponse> {
  try {
    const response = await apiClient.post(
      "/api/v1/golden_hour_quiz/sessions/create/",
      data,
      {
        params: {
          "X-Company-Code": "RTM",
          "X-Secret-Key": "S92PS48OE3",
        },
        headers: {
          Authorization: `Bearer ${token || "14bee5e7ef2d5124ee8fd1d1d1840c28f8a29ec1"}`,
        },
      },
    );
    return {
      success: true,
      data: response.data,
      message: "Session created successfully",
    };
  } catch (error: any) {
    console.error("Error creating session:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to create session",
    };
  }
}

/**
 * Fetch session details by ID
 */
export async function getSessionDetails(
  sessionId: string | number,
): Promise<ApiResponse<SessionData>> {
  try {
    const response = await apiClient.get(
      `/api/v1/golden_hour_quiz/sessions/${sessionId}/`,
      {
        params: {
          "X-Company-Code": "RTM",
          "X-Secret-Key": "S92PS48OE3",
        },
        headers: {
          Authorization: `Bearer ${token || "14bee5e7ef2d5124ee8fd1d1d1840c28f8a29ec1"}`,
        },
      },
    );
    // API returns {success, message, data: {...}}
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Session details fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching session details:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch session details",
    };
  }
}
