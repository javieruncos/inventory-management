import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { ProductsView } from "@/components/products/ProductsView";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Productos",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-5">
          <PageHeader
            title="Productos"
            subtitle="Catálogo de productos del inventario."
          />
          <ProductsSkeleton />
        </div>
      }
    >
      <ProductsView />
    </Suspense>
  );
}
