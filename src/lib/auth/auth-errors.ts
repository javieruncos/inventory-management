export class AuthenticationRequiredError extends Error {
  readonly kind = "UNAUTHORIZED" as const;
  readonly status = 401 as const;

  constructor() {
    super("No autenticado");
    this.name = "AuthenticationRequiredError";
  }
}

export class ForbiddenError extends Error {
  readonly kind = "FORBIDDEN" as const;
  readonly status = 403 as const;

  constructor() {
    super("No autorizado");
    this.name = "ForbiddenError";
  }
}
