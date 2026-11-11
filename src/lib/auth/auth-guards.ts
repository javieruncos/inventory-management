import { cookies } from "next/headers";
import { connectDB } from "@/db/connection";
import UserModel from "@/db/models/User";
import type { AuthenticatedUser } from "@/lib/auth/auth-service";
import {
  AuthenticationRequiredError,
  ForbiddenError,
} from "@/lib/auth/auth-errors";
import { AUTH_COOKIE_NAME } from "@/lib/auth/auth-cookie";
import {
  InvalidAccessTokenError,
  verifyAccessToken,
} from "@/lib/auth/jwt";
import { normalizeError } from "@/lib/errors";

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export type AdminUser = AuthenticatedUser & { role: "admin" };

export async function requireUser(): Promise<AuthenticatedUser> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token || token.trim().length === 0) {
      throw new AuthenticationRequiredError();
    }

    let userId: string;

    try {
      userId = verifyAccessToken(token).userId;
    } catch (error) {
      if (error instanceof InvalidAccessTokenError) {
        throw new AuthenticationRequiredError();
      }

      throw error;
    }

    if (!OBJECT_ID_PATTERN.test(userId)) {
      throw new AuthenticationRequiredError();
    }

    await connectDB();

    const user = await UserModel.findOne({
      _id: userId,
      isActive: true,
    })
      .select("email role")
      .lean();

    if (!user) {
      throw new AuthenticationRequiredError();
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      throw error;
    }

    throw normalizeError(error);
  }
}

export async function getOptionalUser(): Promise<AuthenticatedUser | null> {
  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return null;
    }

    throw error;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireUser();

  if (user.role !== "admin") {
    throw new ForbiddenError();
  }

  return { ...user, role: "admin" };
}
