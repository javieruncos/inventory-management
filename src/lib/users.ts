import * as bcrypt from "bcrypt";
import { connectDB } from "@/db/connection";
import UserModel, { type User } from "@/db/models/User";
import { AppError, normalizeError } from "@/lib/errors";
import { createUserSchema } from "@/schemas/user";
import type { UserDTO } from "@/types/user";

const PASSWORD_SALT_ROUNDS = 12;

type UserRecord = Pick<
  User,
  "_id" | "email" | "role" | "isActive" | "createdAt"
>;

function toUserDTO(user: UserRecord): UserDTO {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

function assertValidId(id: string): void {
  if (typeof id !== "string") {
    throw new AppError({
      kind: "VALIDATION",
      message: "El ID debe ser una cadena de texto",
    });
  }
}

function isSameId(first: string, second: string): boolean {
  return first.toLowerCase() === second.toLowerCase();
}

export async function listUsers(): Promise<UserDTO[]> {
  try {
    await connectDB();

    const users = await UserModel.find()
      .select("email role isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return users.map(toUserDTO);
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createUser(input: unknown): Promise<UserDTO> {
  try {
    const data = createUserSchema.parse(input);

    await connectDB();

    const passwordHash = await bcrypt.hash(
      data.password,
      PASSWORD_SALT_ROUNDS,
    );

    const user = await UserModel.create({
      email: data.email,
      passwordHash,
      role: "user",
      isActive: true,
    });

    return toUserDTO(user);
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deactivateUser(
  id: string,
  actorId: string,
): Promise<UserDTO> {
  try {
    assertValidId(id);

    if (isSameId(id, actorId)) {
      throw new AppError({
        kind: "FORBIDDEN",
        message: "No puedes desactivar tu propia cuenta",
      });
    }

    await connectDB();

    const user = await UserModel.findOne({ _id: id })
      .select("email role isActive createdAt")
      .lean();

    if (!user) {
      throw new AppError({
        kind: "NOT_FOUND",
        message: "El usuario no existe",
      });
    }

    if (!user.isActive) {
      return toUserDTO(user);
    }

    if (user.role === "admin") {
      const activeAdmins = await UserModel.countDocuments({
        role: "admin",
        isActive: true,
      });

      if (activeAdmins <= 1) {
        throw new AppError({
          kind: "CONFLICT",
          message: "No se puede desactivar al último administrador activo",
        });
      }
    }

    const updated = await UserModel.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: { isActive: false } },
      { new: true },
    )
      .select("email role isActive createdAt")
      .lean();

    if (!updated) {
      const current = await UserModel.findOne({ _id: id })
        .select("email role isActive createdAt")
        .lean();

      if (!current) {
        throw new AppError({
          kind: "NOT_FOUND",
          message: "El usuario no existe",
        });
      }

      return toUserDTO(current);
    }

    return toUserDTO(updated);
  } catch (error) {
    throw normalizeError(error);
  }
}
