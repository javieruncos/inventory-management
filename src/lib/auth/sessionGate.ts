import type { AuthUser } from "@/lib/api";

export type SessionGateState =
  | "loading"
  | "error"
  | "anonymous"
  | "authenticated";

export type SessionGateQuery = {
  data: AuthUser | null | undefined;
  isFetching?: boolean;
  isError?: boolean;
};

export function getSessionGateState(
  query: SessionGateQuery,
): SessionGateState {
  if (query.data !== undefined) {
    return query.data === null ? "anonymous" : "authenticated";
  }

  if (query.isFetching) {
    return "loading";
  }

  if (query.isError) {
    return "error";
  }

  return "loading";
}
