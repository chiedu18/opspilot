import {
  isActiveOrderOwner,
  isAvailableOrderCustomer,
  orderSelect,
  toOrderApi,
  updateOrderData,
} from "@/features/orders/order-data";
import {
  apiArchivedOrderUpdate,
  apiInvalidOrderCustomer,
  apiInvalidOrderOwner,
} from "@/features/orders/order-errors";
import { orderUpdateSchema } from "@/features/orders/order-validation";
import {
  apiError,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiValidationError,
} from "@/lib/api/responses";
import { getDemoSession } from "@/lib/auth/demo-session";
import {
  getPrismaClient,
  isDatabaseConfigurationError,
} from "@/lib/db/prisma";
import { validateJsonBody } from "@/lib/validation/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OrderRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: OrderRouteContext) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const { id } = await params;

  try {
    const prisma = getPrismaClient();
    const order = await prisma.workItem.findFirst({
      select: orderSelect,
      where: { id, workspaceId: session.workspaceId },
    });

    if (!order) {
      return apiNotFound("Order");
    }

    return apiOk(toOrderApi(order));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to read order.", error);

    return apiInternalError("Unable to read order.");
  }
}

export async function PATCH(request: Request, { params }: OrderRouteContext) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const { id } = await params;
  const validated = await validateJsonBody(request, orderUpdateSchema);

  if (!validated.success) {
    return apiValidationError(validated.details);
  }

  try {
    const prisma = getPrismaClient();
    const existingOrder = await prisma.workItem.findFirst({
      select: {
        archivedAt: true,
        completedAt: true,
        customerId: true,
        id: true,
        status: true,
      },
      where: { id, workspaceId: session.workspaceId },
    });

    if (!existingOrder) {
      return apiNotFound("Order");
    }

    if (existingOrder.archivedAt) {
      return apiArchivedOrderUpdate();
    }

    if (
      validated.data.customerId &&
      validated.data.customerId !== existingOrder.customerId &&
      !(await isAvailableOrderCustomer(prisma, validated.data.customerId, session.workspaceId))
    ) {
      return apiInvalidOrderCustomer();
    }

    if (
      validated.data.ownerId &&
      !(await isActiveOrderOwner(prisma, validated.data.ownerId))
    ) {
      return apiInvalidOrderOwner();
    }

    const order = await prisma.workItem.update({
      data: updateOrderData(validated.data, existingOrder),
      select: orderSelect,
      where: { id },
    });

    return apiOk(toOrderApi(order));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to update order.", error);

    return apiInternalError("Unable to update order.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: OrderRouteContext,
) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const { id } = await params;

  try {
    const prisma = getPrismaClient();
    const existingOrder = await prisma.workItem.findFirst({
      select: {
        archivedAt: true,
        id: true,
      },
      where: { id, workspaceId: session.workspaceId },
    });

    if (!existingOrder) {
      return apiNotFound("Order");
    }

    const order = await prisma.workItem.update({
      data: {
        archivedAt: existingOrder.archivedAt ?? new Date(),
      },
      select: orderSelect,
      where: { id },
    });

    return apiOk(toOrderApi(order));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to archive order.", error);

    return apiInternalError("Unable to archive order.");
  }
}
