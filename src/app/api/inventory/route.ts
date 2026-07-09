import { NextRequest } from "next/server";

import {
  buildInventoryWhereInput,
  createInventoryData,
  filterInventoryByLowStockState,
  inventoryListOrderBy,
  inventorySelect,
  sortInventoryForList,
  toInventoryApi,
} from "@/features/inventory/inventory-data";
import { validateInventoryRelationships } from "@/features/inventory/inventory-route-rules";
import {
  inventoryCreateSchema,
  inventoryListQuerySchema,
} from "@/features/inventory/inventory-validation";
import {
  apiError,
  apiInternalError,
  apiOk,
  apiValidationError,
} from "@/lib/api/responses";
import {
  getPrismaClient,
  isDatabaseConfigurationError,
} from "@/lib/db/prisma";
import { validateInput, validateJsonBody } from "@/lib/validation/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const listFiltersFromRequest = (request: NextRequest) => ({
  archiveState: request.nextUrl.searchParams.get("archiveState") ?? undefined,
  category: request.nextUrl.searchParams.get("category") ?? undefined,
  customerId: request.nextUrl.searchParams.get("customerId") ?? undefined,
  includeArchived:
    request.nextUrl.searchParams.get("includeArchived") ?? undefined,
  lowStockState:
    request.nextUrl.searchParams.get("lowStockState") ?? undefined,
  ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
  q: request.nextUrl.searchParams.get("q") ?? undefined,
  status: request.nextUrl.searchParams.get("status") ?? undefined,
  workItemId: request.nextUrl.searchParams.get("workItemId") ?? undefined,
});

export async function GET(request: NextRequest) {
  const filters = validateInput(
    inventoryListQuerySchema,
    listFiltersFromRequest(request),
  );

  if (!filters.success) {
    return apiValidationError(filters.details);
  }

  try {
    const prisma = getPrismaClient();
    const inventoryItems = await prisma.inventoryItem.findMany({
      orderBy: inventoryListOrderBy,
      select: inventorySelect,
      take: 200,
      where: buildInventoryWhereInput(filters.data),
    });

    const filteredItems = filterInventoryByLowStockState(
      inventoryItems,
      filters.data.lowStockState,
    );

    return apiOk({
      filters: filters.data,
      inventoryItems: sortInventoryForList(filteredItems).map(toInventoryApi),
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to list inventory items.", error);

    return apiInternalError("Unable to list inventory items.");
  }
}

export async function POST(request: Request) {
  const validated = await validateJsonBody(request, inventoryCreateSchema);

  if (!validated.success) {
    return apiValidationError(validated.details);
  }

  try {
    const prisma = getPrismaClient();
    const relationshipError = await validateInventoryRelationships(
      prisma,
      validated.data,
    );

    if (relationshipError) {
      return relationshipError;
    }

    const inventoryItem = await prisma.inventoryItem.create({
      data: createInventoryData(validated.data),
      select: inventorySelect,
    });

    return apiOk(toInventoryApi(inventoryItem), { status: 201 });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to create inventory item.", error);

    return apiInternalError("Unable to create inventory item.");
  }
}
