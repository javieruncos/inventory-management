import { AppError } from "@/lib/errors";

export class AuthenticationRequiredError extends AppError {
  readonly status = 401 as const;

  constructor() {
    super({ kind: "UNAUTHORIZED", message: "No autenticado" });
    this.name = "AuthenticationRequiredError";
  }
}

export class ForbiddenError extends AppError {
  readonly status = 403 as const;

  constructor() {
    super({ kind: "FORBIDDEN", message: "No autorizado" });
    this.name = "ForbiddenError";
  }
}
