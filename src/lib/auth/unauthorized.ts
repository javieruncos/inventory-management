import type { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { purgePrivateQueries, queryKeys } from "@/lib/queries";

export function isPrivateUnauthorized(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status === 401 &&
    typeof error.path === "string" &&
    error.path.startsWith("/api/") &&
    !error.path.startsWith("/api/auth/")
  );
}

export async function handleUnauthorizedError(
  queryClient: QueryClient,
  error: unknown,
): Promise<void> {
  if (!isPrivateUnauthorized(error)) {
    return;
  }

  if (queryClient.getQueryData(queryKeys.auth.me) === null) {
    return;
  }

  queryClient.setQueryData(queryKeys.auth.me, null);
  await purgePrivateQueries(queryClient);
}
