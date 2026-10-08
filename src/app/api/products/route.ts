import { errorResponse, ok, parseJsonBody } from "@/app/api/_lib/http";
import { createProduct, listProducts } from "@/lib/products";

export async function GET(request: Request): Promise<Response> {
  try {
    const products = await listProducts();

    return ok(products);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseJsonBody(request);

    const product = await createProduct(body);

    return ok(product, 201);
  } catch (error) {
    return errorResponse(error, request);
  }
}
