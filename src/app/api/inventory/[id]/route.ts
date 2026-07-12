import {
  inventorySelect,
  toInventoryApi,
  updateInventoryData,
} from "@/features/inventory/inventory-data";
import { apiArchivedInventoryUpdate } from "@/features/inventory/inventory-errors";
import { validateInventoryRelationships } from "@/features/inventory/inventory-route-rules";
import { inventoryUpdateSchema } from "@/features/inventory/inventory-validation";
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

type InventoryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: InventoryRouteContext,
) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const { id } = await params;

  try {
    const prisma = getPrismaClient();
    const inventoryItem = await prisma.inventoryItem.findFirst({
      select: inventorySelect,
      where: { id, workspaceId: session.workspaceId },
    });

    if (!inventoryItem) {
      return apiNotFound("Inventory item");
    }

    return apiOk(toInventoryApi(inventoryItem));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to read inventory item.", error);

    return apiInternalError("Unable to read inventory item.");
  }
}

export async function PATCH(
  request: Request,
  { params }: InventoryRouteContext,
) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const { id } = await params;
  const validated = await validateJsonBody(request, inventoryUpdateSchema);

  if (!validated.success) {
    return apiValidationError(validated.details);
  }

  try {
    const prisma = getPrismaClient();
    const existingInventoryItem = await prisma.inventoryItem.findFirst({
      select: {
        archivedAt: true,
        customerId: true,
        id: true,
        ownerId: true,
        referenceCode: true,
        status: true,
        workItemId: true,
      },
      where: { id, workspaceId: session.workspaceId },
    });

    if (!existingInventoryItem) {
      return apiNotFound("Inventory item");
    }

    if (existingInventoryItem.archivedAt) {
      return apiArchivedInventoryUpdate();
    }

    const relationshipError = await validateInventoryRelationships(
      prisma,
      validated.data,
      { existing: existingInventoryItem, workspaceId: session.workspaceId },
    );

    if (relationshipError) {
      return relationshipError;
    }

    const inventoryItem = await prisma.inventoryItem.update({
      data: updateInventoryData(validated.data),
      select: inventorySelect,
      where: { id },
    });

    return apiOk(toInventoryApi(inventoryItem));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to update inventory item.", error);

    return apiInternalError("Unable to update inventory item.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: InventoryRouteContext,
) {
  const session = await getDemoSession();
  if (!session) return apiError("UNAUTHORIZED", "Sign in to access your demo workspace.", { status: 401 });
  const { id } = await params;

  try {
    const prisma = getPrismaClient();
    const existingInventoryItem = await prisma.inventoryItem.findFirst({
      select: {
        archivedAt: true,
        id: true,
      },
      where: { id, workspaceId: session.workspaceId },
    });

    if (!existingInventoryItem) {
      return apiNotFound("Inventory item");
    }

    const inventoryItem = await prisma.inventoryItem.update({
      data: {
        archivedAt: existingInventoryItem.archivedAt ?? new Date(),
      },
      select: inventorySelect,
      where: { id },
    });

    return apiOk(toInventoryApi(inventoryItem));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to archive inventory item.", error);

    return apiInternalError("Unable to archive inventory item.");
  }
}
