import * as jwt from "jsonwebtoken";

export const ACCESS_TOKEN_TTL_SECONDS = 30 * 60;
export const JWT_ISSUER = "inventory-management";
export const JWT_AUDIENCE = "inventory-management-web";

const ACCESS_TOKEN_TYPE = "access";
const MIN_JWT_SECRET_LENGTH = 32;

export interface AccessTokenClaims {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

export class JwtConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JwtConfigurationError";
  }
}

export class InvalidAccessTokenError extends Error {
  constructor() {
    super("Token de acceso inválido");
    this.name = "InvalidAccessTokenError";
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length < MIN_JWT_SECRET_LENGTH) {
    throw new JwtConfigurationError(
      `JWT_SECRET debe tener al menos ${MIN_JWT_SECRET_LENGTH} caracteres`,
    );
  }

  return secret;
}

export function signAccessToken(userId: string): string {
  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new TypeError("userId es obligatorio");
  }

  return jwt.sign({ tokenType: ACCESS_TOKEN_TYPE }, getJwtSecret(), {
    subject: userId,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    algorithm: "HS256",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const secret = getJwtSecret();

  if (typeof token !== "string" || token.trim().length === 0) {
    throw new InvalidAccessTokenError();
  }

  let decoded: jwt.JwtPayload | string;

  try {
    decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    throw new InvalidAccessTokenError();
  }

  if (typeof decoded === "string") {
    throw new InvalidAccessTokenError();
  }

  const { sub, tokenType, iss, aud, iat, exp } = decoded;

  if (typeof sub !== "string" || sub.trim().length === 0) {
    throw new InvalidAccessTokenError();
  }

  if (tokenType !== ACCESS_TOKEN_TYPE) {
    throw new InvalidAccessTokenError();
  }

  if (iss !== JWT_ISSUER || aud !== JWT_AUDIENCE) {
    throw new InvalidAccessTokenError();
  }

  if (
    typeof iat !== "number" ||
    !Number.isInteger(iat) ||
    typeof exp !== "number" ||
    !Number.isInteger(exp)
  ) {
    throw new InvalidAccessTokenError();
  }

  return {
    userId: sub,
    issuedAt: iat,
    expiresAt: exp,
  };
}
