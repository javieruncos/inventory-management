import { AppError, normalizeError, type AppErrorKind } from "@/lib/errors";

export type IdRouteContext = {
  params: Promise<{ id: string }>;
};

const STATUS_BY_KIND: Record<AppErrorKind, number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

const MONGO_URI_PATTERN = /mongodb(?:\+srv)?:\/\/[^\s"'\\]+/gi;

function redactSecrets(value: string): string {
  return value.replace(MONGO_URI_PATTERN, "mongodb://***");
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) {
    return `${cause.name}: ${cause.message}`;
  }

  if (typeof cause === "string") {
    return cause;
  }

  try {
    return JSON.stringify(cause) ?? String(cause);
  } catch {
    return String(cause);
  }
}

function findRootCause(error: AppError): unknown {
  let current: unknown = error;
  let depth = 0;

  while (depth < 10) {
    const next = current instanceof Error ? current.cause : undefined;

    if (next === undefined || next === null || next === current) {
      break;
    }

    current = next;
    depth += 1;
  }

  return current === error ? undefined : current;
}

function logInternalError(error: AppError, request?: Request): void {
  const rootCause = findRootCause(error);
  const stackSource =
    rootCause instanceof Error && typeof rootCause.stack === "string"
      ? rootCause.stack
      : error.stack;

  const entry = {
    timestamp: new Date().toISOString(),
    ...(request
      ? { method: request.method, pathname: new URL(request.url).pathname }
      : {}),
    kind: error.kind,
    message: error.message,
    ...(rootCause !== undefined
      ? { cause: redactSecrets(describeCause(rootCause)) }
      : {}),
    ...(typeof stackSource === "string"
      ? { stack: redactSecrets(stackSource) }
      : {}),
  };

  console.error(JSON.stringify(entry));
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  }
}

export function ok(data: unknown, status = 200): Response {
  return Response.json({ data }, { status });
}

export function errorResponse(error: unknown, request?: Request): Response {
  const appError = error instanceof AppError ? error : normalizeError(error);

  if (appError.kind === "INTERNAL") {
    logInternalError(appError, request);
  }

  return Response.json(
    { error: appError.toJSON() },
    { status: STATUS_BY_KIND[appError.kind] },
  );
}
