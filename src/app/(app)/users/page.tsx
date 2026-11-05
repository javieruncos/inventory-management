import type { Metadata } from "next";
import { AdminGate } from "@/components/auth/AdminGate";
import { UsersView } from "@/components/users/UsersView";

export const metadata: Metadata = {
  title: "Usuarios",
};

export default function UsersPage() {
  return (
    <AdminGate>
      <UsersView />
    </AdminGate>
  );
}
