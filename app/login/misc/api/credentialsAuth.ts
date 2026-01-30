"use client";

import { useAuth } from "@/contexts/AuthContext";
import { gameAxios, setAxiosDefaultToken, tokenlessAxios } from "@/lib/axios";
import { tokenStorage } from "@/lib/tokens";
import { useMutation } from "@tanstack/react-query";

interface RegisterPayload {
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  password: string;
}

interface LoginPayload {
  username?: string;
  email?: string;
  password: string;
}

const registerUser = async (payload: RegisterPayload) => {
  const { data } = await tokenlessAxios.post(
    "/api/accounts/user/register/",
    payload,
  );
  return data;
};

const loginUser = async (payload: LoginPayload) => {
  const { data } = await tokenlessAxios.post("/api/web/login/", payload);
  return data as APIResponse;
};

export const useRegister = () => {
  return useMutation<any, Error, RegisterPayload>({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
    retry: (failureCount, error: any) => {
      if (
        failureCount < 2 &&
        (error.code === "NETWORK_ERROR" ||
          error.message?.includes("Network Error"))
      )
        return true;
      return false;
    },
  });
};

interface APIResponse {
  token: string;
}

export const useCredentialsLogin = () => {
  const { authDispatch } = useAuth();

  return useMutation<APIResponse, Error, LoginPayload>({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    retry: (failureCount, error: any) => {
      if (
        failureCount < 2 &&
        (error.code === "NETWORK_ERROR" ||
          error.message?.includes("Network Error"))
      )
        return true;
      return false;
    },
    onSuccess: async (data) => {
      console.log(data, "DATTAA");
      const token = data?.token;
      if (!token) {
        console.warn("No token returned from login — response shape:", data);
        authDispatch?.({ type: "STOP_LOADING" });
        return;
      }
      tokenStorage.setToken(token);
      setAxiosDefaultToken(token, gameAxios);
    },
  });
};
