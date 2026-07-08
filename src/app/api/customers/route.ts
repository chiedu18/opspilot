import { NextRequest } from "next/server";

import {
  buildCustomerWhereInput,
  createCustomerData,
  customerListOrderBy,
  customerSelect,
  isActiveTeamMember,
  toCustomerApi,
} from "@/features/customers/customer-data";
import { apiInvalidCustomerOwner } from "@/features/customers/customer-errors";
import {
  customerCreateSchema,
  customerListQuerySchema,
} from "@/features/customers/customer-validation";
import { apiError, apiInternalError, apiOk, apiValidationError } from "@/lib/api/responses";
import {
  getPrismaClient,
  isDatabaseConfigurationError,
} from "@/lib/db/prisma";
import { validateInput, validateJsonBody } from "@/lib/validation/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const listFiltersFromRequest = (request: NextRequest) => ({
  includeArchived: request.nextUrl.searchParams.get("includeArchived") ?? undefined,
  ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
  q: request.nextUrl.searchParams.get("q") ?? undefined,
  status: request.nextUrl.searchParams.get("status") ?? undefined,
});

export async function GET(request: NextRequest) {
  const filters = validateInput(
    customerListQuerySchema,
    listFiltersFromRequest(request),
  );

  if (!filters.success) {
    return apiValidationError(filters.details);
  }

  try {
    const prisma = getPrismaClient();
    const customers = await prisma.customer.findMany({
      orderBy: customerListOrderBy,
      select: customerSelect,
      take: 100,
      where: buildCustomerWhereInput(filters.data),
    });

    return apiOk({
      customers: customers.map(toCustomerApi),
      filters: filters.data,
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to list customers.", error);

    return apiInternalError("Unable to list customers.");
  }
}

export async function POST(request: Request) {
  const validated = await validateJsonBody(request, customerCreateSchema);

  if (!validated.success) {
    return apiValidationError(validated.details);
  }

  try {
    const prisma = getPrismaClient();

    if (
      validated.data.ownerId &&
      !(await isActiveTeamMember(prisma, validated.data.ownerId))
    ) {
      return apiInvalidCustomerOwner();
    }

    const customer = await prisma.customer.create({
      data: createCustomerData(validated.data),
      select: customerSelect,
    });

    return apiOk(toCustomerApi(customer), { status: 201 });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to create customer.", error);

    return apiInternalError("Unable to create customer.");
  }
}
