import * as jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  InvalidAccessTokenError,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JwtConfigurationError,
  signAccessToken,
  verifyAccessToken,
} from "@/lib/auth/jwt";

const TEST_SECRET = "test-only-jwt-secret-with-more-than-32-characters";
const OTHER_SECRET = "other-test-only-jwt-secret-with-32-characters";
const USER_ID = "507f1f77bcf86cd799439011";

interface TokenOptions {
  payload?: Record<string, unknown>;
  secret?: string;
  options?: jwt.SignOptions;
}

function makeToken({
  payload = { tokenType: "access" },
  secret = TEST_SECRET,
  options = {},
}: TokenOptions = {}): string {
  return jwt.sign(payload, secret, {
    subject: USER_ID,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    algorithm: "HS256",
    ...options,
  });
}

function toBase64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", TEST_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("signAccessToken", () => {
  it("firma un token verificable con el id del usuario", () => {
    const token = signAccessToken(USER_ID);

    expect(verifyAccessToken(token)).toMatchObject({
      userId: USER_ID,
    });
  });

  it("incluye los claims esperados y una expiración de 30 minutos", () => {
    const token = signAccessToken(USER_ID);
    const decoded = jwt.decode(token);

    expect(decoded).not.toBeNull();
    expect(typeof decoded).toBe("object");

    const payload = decoded as jwt.JwtPayload;

    expect(payload.sub).toBe(USER_ID);
    expect(payload.tokenType).toBe("access");
    expect(payload.iss).toBe(JWT_ISSUER);
    expect(payload.aud).toBe(JWT_AUDIENCE);
    expect(payload.iat).toEqual(expect.any(Number));
    expect(payload.exp).toEqual(expect.any(Number));
    expect(payload.exp! - payload.iat!).toBe(ACCESS_TOKEN_TTL_SECONDS);
    expect(payload).not.toHaveProperty("role");
  });

  it("rechaza un id de usuario vacío", () => {
    expect(() => signAccessToken(" ")).toThrow(TypeError);
  });

  it("rechaza un JWT_SECRET ausente o vacío", () => {
    vi.stubEnv("JWT_SECRET", "");

    expect(() => signAccessToken(USER_ID)).toThrow(JwtConfigurationError);
  });

  it("rechaza un JWT_SECRET demasiado corto", () => {
    vi.stubEnv("JWT_SECRET", "secreto-corto");

    expect(() => signAccessToken(USER_ID)).toThrow(JwtConfigurationError);
  });

  it("rechaza un JWT_SECRET compuesto solo por espacios", () => {
    vi.stubEnv("JWT_SECRET", " ".repeat(64));

    expect(() => signAccessToken(USER_ID)).toThrow(JwtConfigurationError);
  });
});

describe("verifyAccessToken", () => {
  it("devuelve los tiempos de emisión y expiración", () => {
    const token = signAccessToken(USER_ID);
    const claims = verifyAccessToken(token);

    expect(claims.userId).toBe(USER_ID);
    expect(claims.expiresAt - claims.issuedAt).toBe(
      ACCESS_TOKEN_TTL_SECONDS,
    );
  });

  it("rechaza un token firmado con otro secreto", () => {
    const token = makeToken({ secret: OTHER_SECRET });

    expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it("rechaza un issuer incorrecto", () => {
    const token = makeToken({ options: { issuer: "otro-emisor" } });

    expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it("rechaza una audience incorrecta", () => {
    const token = makeToken({ options: { audience: "otra-audiencia" } });

    expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it("rechaza un algoritmo distinto de HS256", () => {
    const token = makeToken({ options: { algorithm: "HS512" } });

    expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it("rechaza un token sin firma", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = [
      toBase64Url({ alg: "none", typ: "JWT" }),
      toBase64Url({
        sub: USER_ID,
        tokenType: "access",
        iss: JWT_ISSUER,
        aud: JWT_AUDIENCE,
        iat: now,
        exp: now + ACCESS_TOKEN_TTL_SECONDS,
      }),
      "",
    ].join(".");

    expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it("rechaza un token que no sea de tipo access", () => {
    const token = makeToken({ payload: { tokenType: "refresh" } });

    expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it("rechaza un token sin subject", () => {
    const token = jwt.sign({ tokenType: "access" }, TEST_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      algorithm: "HS256",
    });

    expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it("rechaza un token sin expiración", () => {
    const token = jwt.sign({ tokenType: "access" }, TEST_SECRET, {
      subject: USER_ID,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: "HS256",
    });

    expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it("rechaza un token expirado", () => {
    const token = makeToken({ options: { expiresIn: -1 } });

    expect(() => verifyAccessToken(token)).toThrow(InvalidAccessTokenError);
  });

  it.each(["", "no-es-un-jwt", "encabezado.payload.firma"])(
    "rechaza un token vacío o malformado: %j",
    (token) => {
      expect(() => verifyAccessToken(token)).toThrow(
        InvalidAccessTokenError,
      );
    },
  );

  it("rechaza verificar si JWT_SECRET no es seguro", () => {
    const token = makeToken();

    vi.stubEnv("JWT_SECRET", "secreto-corto");

    expect(() => verifyAccessToken(token)).toThrow(JwtConfigurationError);
  });
});
