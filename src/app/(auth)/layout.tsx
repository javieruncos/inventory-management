import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GuestOnly } from "@/components/auth/AuthGate";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestOnly fallbackTone="dark">
      <div className="login-theme flex h-dvh flex-col bg-[var(--login-bg)] text-[var(--login-text)]">
        <main className="flex min-h-0 w-full flex-1 flex-col">{children}</main>
      </div>
    </GuestOnly>
  );
}

