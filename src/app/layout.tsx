import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Inventory Management",
    template: "%s · Inventory Management",
  },
  description:
    "Sistema de gestión de inventario: productos, categorías, proveedores y movimientos de stock.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
