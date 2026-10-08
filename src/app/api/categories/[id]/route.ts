import {
  errorResponse,
  ok,
  parseJsonBody,
  type IdRouteContext,
} from "@/app/api/_lib/http";
import { deleteCategory, getCategory, updateCategory } from "@/lib/categories";

export async function GET(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    const { id } = await params;

    const category = await getCategory(id);

    return ok(category);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function PUT(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    const { id } = await params;

    const body = await parseJsonBody(request);

    const category = await updateCategory(id, body);

    return ok(category);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function DELETE(
  request: Request,
  { params }: IdRouteContext,
): Promise<Response> {
  try {
    const { id } = await params;

    const deleted = await deleteCategory(id);

    return ok(deleted);
  } catch (error) {
    return errorResponse(error, request);
  }
}
