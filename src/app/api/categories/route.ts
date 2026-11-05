import { errorResponse, ok, parseJsonBody } from "@/app/api/_lib/http";
import { requireAdmin, requireUser } from "@/lib/auth/auth-guards";
import { createCategory, listCategories } from "@/lib/categories";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireUser();

    const categories = await listCategories();

    return ok(categories);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAdmin();

    const body = await parseJsonBody(request);

    const category = await createCategory(body);

    return ok(category, 201);
  } catch (error) {
    return errorResponse(error, request);
  }
}
