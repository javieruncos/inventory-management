import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { ProductsView } from "@/components/products/ProductsView";

export const metadata: Metadata = {
  title: "Productos",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsView />
    </Suspense>
  );
}
