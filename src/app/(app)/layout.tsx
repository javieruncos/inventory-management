import type { ReactNode } from "react";
import { AppAccessGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/shell/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppAccessGate>
      <AppShell>{children}</AppShell>
    </AppAccessGate>
  );
}

