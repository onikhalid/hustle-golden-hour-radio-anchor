"use client";
import React, { createContext, useContext, useEffect, useReducer } from "react";
import {
  deleteAxiosDefaultToken,
  gameAxios,
  setAxiosDefaultToken,
} from "@/lib/axios";
import { tokenStorage } from "@/lib/tokens";
import { useRouter } from "next/navigation";

interface User {
  user_id: number;
  username: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" }
  | { type: "STOP_LOADING" }
  | { type: "UPDATE_USER"; payload: Partial<User> };

interface AuthContextType {
  authState: AuthState;
  authDispatch: React.Dispatch<AuthAction>;
  ensureToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  try {
    switch (action.type) {
      case "LOGIN":
        tokenStorage.setUser(action.payload);
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload,
          isLoading: false,
        };
      case "UPDATE_USER":
        const updatedUser = state.user
          ? { ...state.user, ...action.payload }
          : null;
        if (updatedUser) tokenStorage.setUser(updatedUser);
        return { ...state, user: updatedUser };
      case "LOGOUT":
        try {
          tokenStorage.clearToken();
          deleteAxiosDefaultToken();
        } catch (error) {
          console.error("❌ Error during logout:", error);
        }
        return {
          ...state,
          isAuthenticated: false,
          user: null,
          isLoading: false,
        };
      case "STOP_LOADING":
        return { ...state, isLoading: false };
      default:
        return state;
    }
  } catch (error) {
    console.error("❌ Auth reducer error:", error);
    return { ...state, isLoading: false };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, authDispatch] = useReducer(authReducer, initialState);
  const router = useRouter();
  const ensureToken = (): string | null => {
    const token = tokenStorage.getToken();
    if (token) {
      setAxiosDefaultToken(token, gameAxios);
      return token;
    }
    return null;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = tokenStorage.getToken();
        if (token) {
          setAxiosDefaultToken(token, gameAxios);
          try {
            const res = await gameAxios.get("/api/accounts/user/details");
            console.log(res.data);
            authDispatch({ type: "LOGIN", payload: res.data?.data as User });
          } catch (error: any) {
            console.error("Error fetching user details:", error);
            if (error.response && [401, 403].includes(error.response.status)) {
              console.log("Token invalid/expired, logging out...");
              authDispatch({ type: "LOGOUT" });
              router.push("/login");
            } else {
              // Even if it is not 401, if we can't get user details, we might be in a bad state.
              // But strictly for this task, we focus on auth errors.
              // Optionally fall back to unauthenticated if critical for app function?
              // For now, let's assume network errors etc should not log them out aggressively unless status is definitive.
              authDispatch({ type: "STOP_LOADING" });
            }
          }
        } else {
          authDispatch({ type: "STOP_LOADING" });
          authDispatch({ type: "LOGOUT" });
          router.push("/login");
        }
      } finally {
        authDispatch({ type: "STOP_LOADING" });
      }
    };
    initializeAuth();

    const interceptor = gameAxios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.log("Global 401 interceptor triggered");
          authDispatch({ type: "LOGOUT" });
          router.push("/login");
        }
        return Promise.reject(error);
      },
    );

    return () => {
      gameAxios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authState, authDispatch, ensureToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
