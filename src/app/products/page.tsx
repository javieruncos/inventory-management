import type { Metadata } from "next";
import { ProductsView } from "@/components/products/ProductsView";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return <ProductsView />;
}
