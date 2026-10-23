import type { Metadata } from "next";
import { ProductDetailView } from "@/components/products/ProductDetailView";

export const metadata: Metadata = {
  title: "Detalle de producto",
};

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  return <ProductDetailView productId={id} />;
}
