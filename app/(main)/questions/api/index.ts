import { createQuestion, updateQuestion } from "@/lib/api/dashboardApi";
import {
  CreateQuestionData,
  UpdateQuestionData,
} from "@/lib/types/dashboard.types";
import { useMutation } from "@tanstack/react-query";

export const useCreateQuestion = () => {
  return useMutation({
    mutationFn: (data: CreateQuestionData) => createQuestion(data),
  });
};

export const useUpdateQuestion = () => {
  return useMutation({
    mutationFn: (data: UpdateQuestionData) => updateQuestion(data),
  });
};

export * from "./getQuestons";
