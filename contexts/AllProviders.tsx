"use client";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import React from "react";
import { MQTTProvider } from "./MQTTProvider";

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MQTTProvider>{children}</MQTTProvider>
    </QueryClientProvider>
  );
};

export default AllProviders;
