import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GuestOnly } from "@/components/auth/AuthGate";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestOnly>
      <div className="flex min-h-dvh flex-col bg-canvas">
        <main className="w-full">{children}</main>
      </div>
    </GuestOnly>
  );
}

