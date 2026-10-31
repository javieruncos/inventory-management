import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GuestOnly } from "@/components/auth/AuthGate";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestOnly>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-8">
        <main className="w-full max-w-[420px]">{children}</main>
      </div>
    </GuestOnly>
  );
}

