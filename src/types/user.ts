export type UserRole = "user" | "admin";

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}
