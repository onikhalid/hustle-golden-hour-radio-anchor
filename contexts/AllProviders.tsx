"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import React from "react";
import { AblyProvider } from "./AblyProvider";
import { AuthProvider } from "./AuthContext";
import { Toaster } from "@/components/ui/toaster";

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <AblyProvider>{children}</AblyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default AllProviders;
