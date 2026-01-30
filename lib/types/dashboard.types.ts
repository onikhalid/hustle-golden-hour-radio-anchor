import { z } from "zod";

// Weekly Winner Types
export const weeklyWinnerSchema = z.object({
  winner_phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^0\d{10}$/, "Phone number must start with 0 and be 11 digits"),
  index_number: z
    .string()
    .min(1, "Index number is required")
    .regex(/^\d+$/, "Index number must contain only digits"),
  week_date: z
    .string()
    .min(1, "Week date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export type WeeklyWinnerData = z.infer<typeof weeklyWinnerSchema>;

// Agent Record Types
export const agentRecordSchema = z.object({
  address: z.string().min(1, "Address is required"),
  user_id: z.string().min(1, "User ID is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^0\d{10}$/, "Phone number must start with 0 and be 11 digits"),
  email: z.string().email("Invalid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  user_uuid: z
    .string()
    .min(1, "User UUID is required")
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "Invalid UUID format",
    ),
});

export type AgentRecordData = z.infer<typeof agentRecordSchema>;

// Quiz Question Types
export const assignQuestionSchema = z.object({
  session_id: z.number().min(1, "Session ID is required"),
  question_id: z.number().min(1, "Question ID is required"),
  order_index: z.number().optional(),
});

export type AssignQuestionData = z.infer<typeof assignQuestionSchema>;

export const updateQuestionSchema = z.object({
  question_id: z.number().min(1, "Question ID is required"),
  question: z.string().min(1, "Question text is required"),
  correct_option: z.enum(["A", "B", "C", "D"], {
    errorMap: () => ({ message: "Correct option must be A, B, C, or D" }),
  }),
  category: z.string().min(1, "Category is required"),
});

export type UpdateQuestionData = z.infer<typeof updateQuestionSchema>;

export interface CategoryData {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  description?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
