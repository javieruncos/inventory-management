import type { Metadata } from "next";
import { SuppliersView } from "@/components/suppliers/SuppliersView";

export const metadata: Metadata = {
  title: "Suppliers",
};

export default function SuppliersPage() {
  return <SuppliersView />;
}
