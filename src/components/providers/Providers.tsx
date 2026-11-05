"use client";

import { useState, type ReactNode } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { handleUnauthorizedError } from "@/lib/auth/unauthorized";
import { queryClientDefaultOptions } from "@/lib/queries";

type ProvidersProps = {
  children: ReactNode;
};

function createQueryClient(): QueryClient {
  const clientRef: { current: QueryClient | null } = { current: null };

  const onError = (error: unknown) => {
    const currentClient = clientRef.current;
    if (currentClient) {
      void handleUnauthorizedError(currentClient, error);
    }
  };

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: queryClientDefaultOptions,
  });

  clientRef.current = queryClient;

  return queryClient;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
