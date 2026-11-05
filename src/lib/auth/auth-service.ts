import * as bcrypt from "bcrypt";
import { connectDB } from "@/db/connection";
import UserModel, { type User } from "@/db/models/User";
import { signAccessToken } from "@/lib/auth/jwt";
import { AppError, normalizeError } from "@/lib/errors";

const DUMMY_PASSWORD_HASH =
  "$2b$12$8kumSJsTlcmqL998gb8Kk.zHMfFXisenPUw8UD9AZsBVjhiuOFZTy";

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: User["role"];
}

export interface AuthenticationResult {
  token: string;
  user: AuthenticatedUser;
}

export class InvalidCredentialsError extends AppError {
  readonly status = 401 as const;

  constructor() {
    super({ kind: "UNAUTHORIZED", message: "Credenciales inválidas" });
    this.name = "InvalidCredentialsError";
  }
}

function assertValidPasswordHash(passwordHash: string): void {
  try {
    bcrypt.getRounds(passwordHash);
  } catch {
    throw new Error("Hash de contraseña inválido");
  }
}

export async function authenticateUser(
  input: AuthenticateUserInput,
): Promise<AuthenticationResult> {
  try {
    const email = input.email.trim().toLowerCase();

    await connectDB();

    const user = await UserModel.findOne({ email })
      .select("+passwordHash")
      .lean();

    if (user) {
      if (typeof user.passwordHash !== "string") {
        throw new Error("Hash de contraseña inválido");
      }

      assertValidPasswordHash(user.passwordHash);
    }

    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(input.password, passwordHash);

    if (!user || !passwordMatches || !user.isActive) {
      throw new InvalidCredentialsError();
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      token: signAccessToken(authenticatedUser.id),
      user: authenticatedUser,
    };
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      throw error;
    }

    throw normalizeError(error);
  }
}
