import type { Metadata } from "next";
import { StockMovementsView } from "@/components/stock/StockMovementsView";

export const metadata: Metadata = {
  title: "Movimientos de stock",
};

export default function StockMovementsPage() {
  return <StockMovementsView />;
}
