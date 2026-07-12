import { NextRequest } from "next/server";

import {
  buildOrderWhereInput,
  createOrderData,
  isActiveOrderOwner,
  isAvailableOrderCustomer,
  orderListOrderBy,
  orderSelect,
  sortOrdersForList,
  toOrderApi,
} from "@/features/orders/order-data";
import {
  apiInvalidOrderCustomer,
  apiInvalidOrderOwner,
} from "@/features/orders/order-errors";
import {
  orderCreateSchema,
  orderListQuerySchema,
} from "@/features/orders/order-validation";
import {
  apiError,
  apiInternalError,
  apiOk,
  apiValidationError,
} from "@/lib/api/responses";
import { getDemoSession } from "@/lib/auth/demo-session";
import {
  getPrismaClient,
  isDatabaseConfigurationError,
} from "@/lib/db/prisma";
import { validateInput, validateJsonBody } from "@/lib/validation/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const listFiltersFromRequest = (request: NextRequest) => ({
  archiveState: request.nextUrl.searchParams.get("archiveState") ?? undefined,
  customerId: request.nextUrl.searchParams.get("customerId") ?? undefined,
  dueDateBucket:
    request.nextUrl.searchParams.get("dueDateBucket") ?? undefined,
  includeArchived:
    request.nextUrl.searchParams.get("includeArchived") ?? undefined,
  kind: request.nextUrl.searchParams.get("kind") ?? undefined,
  ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
  priority: request.nextUrl.searchParams.get("priority") ?? undefined,
  q: request.nextUrl.searchParams.get("q") ?? undefined,
  status: request.nextUrl.searchParams.get("status") ?? undefined,
});

export async function GET(request: NextRequest) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const filters = validateInput(
    orderListQuerySchema,
    listFiltersFromRequest(request),
  );

  if (!filters.success) {
    return apiValidationError(filters.details);
  }

  try {
    const prisma = getPrismaClient();
    const referenceDate = new Date();
    const orders = await prisma.workItem.findMany({
      orderBy: orderListOrderBy,
      select: orderSelect,
      take: 100,
      where: { AND: [{ workspaceId: session.workspaceId }, buildOrderWhereInput(filters.data, referenceDate)] },
    });

    return apiOk({
      filters: filters.data,
      orders: sortOrdersForList(orders, referenceDate).map((order) =>
        toOrderApi(order, referenceDate),
      ),
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to list orders.", error);

    return apiInternalError("Unable to list orders.");
  }
}

export async function POST(request: Request) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const validated = await validateJsonBody(request, orderCreateSchema);

  if (!validated.success) {
    return apiValidationError(validated.details);
  }

  try {
    const prisma = getPrismaClient();

    if (
      !(await isAvailableOrderCustomer(prisma, validated.data.customerId, session.workspaceId))
    ) {
      return apiInvalidOrderCustomer();
    }

    if (!(await isActiveOrderOwner(prisma, validated.data.ownerId))) {
      return apiInvalidOrderOwner();
    }

    const order = await prisma.workItem.create({
      data: {
        ...createOrderData(validated.data),
        workspace: { connect: { id: session.workspaceId } },
      },
      select: orderSelect,
    });

    return apiOk(toOrderApi(order), { status: 201 });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to create order.", error);

    return apiInternalError("Unable to create order.");
  }
}
