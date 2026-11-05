import { errorResponse, ok, parseJsonBody } from "@/app/api/_lib/http";
import { requireAdmin, requireUser } from "@/lib/auth/auth-guards";
import { createSupplier, listSuppliers } from "@/lib/suppliers";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireUser();

    const suppliers = await listSuppliers();

    return ok(suppliers);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAdmin();

    const body = await parseJsonBody(request);

    const supplier = await createSupplier(body);

    return ok(supplier, 201);
  } catch (error) {
    return errorResponse(error, request);
  }
}
