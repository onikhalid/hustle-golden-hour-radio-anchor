import { gameAxios } from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

interface CreateLiveQuizPayload {
  name: string;
  description: string;
}

interface CreateLiveQuizResponse {
  status: string;
  message: string;
  data: LiveQuizSession;
}

const createLiveQuiz = async (payload: CreateLiveQuizPayload) => {
  const res = await gameAxios.post("/quiz/realtime/create/", payload);
  return res.data as CreateLiveQuizResponse;
};
export const useCreateLiveQuiz = () => {
  return useMutation({ mutationFn: createLiveQuiz });
};

const startAnchorSession = async (id: string | number) => {
  const res = await gameAxios.post(
    `/api/v1/golden_hour_quiz/sessions/start/?X-Company-Code=RTM&X-Secret-Key=S92PS48OE3`,
  );
  return res.data;
};

export const useStartAnchorSession = () => {
  return useMutation({
    mutationFn: (id: string | number) => startAnchorSession(id),
  });
};

const startQuizGame = async (id: string | number) => {
  const res = await gameAxios.put(`/quiz/start/${id}`);
  return res.data;
};
export const useStartQuizGame = () => {
  return useMutation({
    mutationFn: (id: string | number) => startQuizGame(id),
  });
};

const startQuestionTime = async (id: string | number) => {
  const res = await gameAxios.put(
    `/api/v1/golden_hour_quiz/questions/start-time/${id}?X-Company-Code=RTM&X-Secret-Key=S92PS48OE3`,
  );
  return res.data;
};
export const useStartQuestionTime = () => {
  return useMutation({
    mutationFn: (id: string | number) => startQuestionTime(id),
  });
};

const elapseQuestionTime = async (id: string | number) => {
  const res = await gameAxios.put(
    `/api/v1/golden_hour_quiz/questions/time-elapse/${id}?X-Company-Code=RTM&X-Secret-Key=S92PS48OE3`,
  );
  return res.data;
};
export const useElapseQuestionTime = () => {
  return useMutation({
    mutationFn: (id: string | number) => elapseQuestionTime(id),
  });
};

const stopQuizBroadcast = async (id: string | number) => {
  const res = await gameAxios.get(`/quiz/stop/broadcast/${id}`);
  return res.data;
};
export const useStopQuizBroadcast = () => {
  return useMutation({
    mutationFn: (id: string | number) => stopQuizBroadcast(id),
  });
};

const getRealtimeStageDetails = async (id: string | number) => {
  const res = await gameAxios.get(`/quiz/realtime/stage/details/${id}`);
  return res.data;
};
export const useRealtimeStageDetails = (id?: string | number) => {
  return useQuery({
    queryFn: () => getRealtimeStageDetails(id!),
    queryKey: ["quiz-realtime-stage-details", id],
    enabled: !!id,
  });
};

const getHostRealtimeToken = async (id: string | number) => {
  const res = await gameAxios.post(`/quiz/realtime/token/host/${id}`);
  return res.data;
};
export const useHostRealtimeToken = () => {
  return useMutation({
    mutationFn: (id: string | number) => getHostRealtimeToken(id),
  });
};

const createHostRealtimeToken = async (id: string | number) => {
  const res = await gameAxios.post(`/quiz/realtime/create/`);
  return res.data;
};
export const useCreateHostRealtimeToken = () => {
  return useMutation({
    mutationFn: (id: string | number) => createHostRealtimeToken(id),
  });
};

export const getQuestionResultsTally = async (id: string | number) => {
  const res = await gameAxios.get(
    `/api/v1/golden_hour_quiz/questions/tally/${id}?X-Company-Code=RTM&X-Secret-Key=S92PS48OE3`,
  );
  return res.data as QuestionTallyResponse;
};
export const useGetQuestionResultsTally = (id?: string | number) => {
  return useQuery({
    queryFn: () => getQuestionResultsTally(id!),
    queryKey: ["get-question-results-tally", id],
    enabled: !!id,
  });
};

export interface QuestionTallyResponse {
  status: string;
  message: string;
  data: {
    question: Question;
    results: QuestionResult[];
  };
}

export interface QuestionResult {
  user_id: number;
  phone_number: string;
  answered_in: number;
  is_correct: boolean;
  is_winner: boolean;
  answer: string;
}

export interface Question {
  question_id: number;
  correct_option: string;
}

interface QuizzesListResponse {
  count: number;
  next: null;
  previous: null;
  results: {
    status: string;
    message: string;
    data: LiveQuizSession[];
  };
}

export interface LiveQuizSession {
  id: number;
  name: string | null;
  description: string | null;
  game_code: string;
  anchor_id: number;
  anchor_name: string;
  status: string;
  winner_id: string | null;
}

const listQuizSessions = async () => {
  const res = await gameAxios.get("/quiz/list/sessions");
  return res.data as QuizzesListResponse;
};
export const useListQuizSessions = () => {
  return useQuery({
    queryFn: listQuizSessions,
    queryKey: ["list-quiz-sessions"],
  });
};

const retrieveQuiz = async (id: string | number) => {
  const res = await gameAxios.get(
    `/api/v1/golden_hour_quiz/sessions/${id}/?X-Company-Code=RTM&X-Secret-Key=S92PS48OE3`,
  );
  return res.data;
};

export const useRetrieveQuiz = (id?: string | number) => {
  return useQuery({
    queryFn: () => retrieveQuiz(id!),
    queryKey: ["retrieve-quiz", id],
    enabled: !!id,
  });
};

export interface QuizStartDetailsResponse {
  status: string;
  message: string;
  data: QuizStartDetails;
}

export interface QuizStartDetails {
  channel_arn: string;
  ingest_server: string;
  playback_url: string;
  latency_mode: string;
  stream_key: string;
}

const retrieveQuizStartDetails = async (id: string | number) => {
  const res = await gameAxios.get(`/quiz/start/details/${id}`);
  return res.data as QuizStartDetailsResponse;
};

export const useQuizStartDetails = (id?: string | number) => {
  return useQuery({
    queryFn: () => retrieveQuizStartDetails(id!),
    queryKey: ["quiz-start-details", id],
    enabled: !!id,
  });
};

interface LockAnswerPayload {
  phone_number: string;
  question_id: number;
  ticket_purchase_id: string;
}

const lockAnswer = async (payload: LockAnswerPayload) => {
  const res = await gameAxios.post(
    "/api/v1/golden_hour_quiz/lock/answer/?X-Company-Code=RTM&X-Secret-Key=S92PS48OE3",
    payload,
  );
  return res.data;
};

export const useLockAnswer = () => {
  return useMutation({
    mutationFn: lockAnswer,
  });
};
