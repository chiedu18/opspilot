import { CustomerStatus } from "@/generated/prisma/client";

import {
  customerSelect,
  isActiveTeamMember,
  toCustomerApi,
  updateCustomerData,
} from "@/features/customers/customer-data";
import {
  apiArchivedCustomerUpdate,
  apiInvalidCustomerOwner,
} from "@/features/customers/customer-errors";
import { customerUpdateSchema } from "@/features/customers/customer-validation";
import {
  apiError,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiValidationError,
} from "@/lib/api/responses";
import {
  getPrismaClient,
  isDatabaseConfigurationError,
} from "@/lib/db/prisma";
import { validateJsonBody } from "@/lib/validation/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CustomerRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: CustomerRouteContext) {
  const { id } = await params;

  try {
    const prisma = getPrismaClient();
    const customer = await prisma.customer.findUnique({
      select: customerSelect,
      where: { id },
    });

    if (!customer) {
      return apiNotFound("Customer");
    }

    return apiOk(toCustomerApi(customer));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to read customer.", error);

    return apiInternalError("Unable to read customer.");
  }
}

export async function PATCH(
  request: Request,
  { params }: CustomerRouteContext,
) {
  const { id } = await params;
  const validated = await validateJsonBody(request, customerUpdateSchema);

  if (!validated.success) {
    return apiValidationError(validated.details);
  }

  try {
    const prisma = getPrismaClient();
    const existingCustomer = await prisma.customer.findUnique({
      select: {
        archivedAt: true,
        id: true,
      },
      where: { id },
    });

    if (!existingCustomer) {
      return apiNotFound("Customer");
    }

    if (
      existingCustomer.archivedAt &&
      validated.data.status &&
      validated.data.status !== CustomerStatus.ARCHIVED
    ) {
      return apiArchivedCustomerUpdate();
    }

    if (
      validated.data.ownerId &&
      !(await isActiveTeamMember(prisma, validated.data.ownerId))
    ) {
      return apiInvalidCustomerOwner();
    }

    const customer = await prisma.customer.update({
      data: {
        ...updateCustomerData(validated.data),
        ...(validated.data.status === CustomerStatus.ARCHIVED &&
        !existingCustomer.archivedAt
          ? { archivedAt: new Date() }
          : {}),
      },
      select: customerSelect,
      where: { id },
    });

    return apiOk(toCustomerApi(customer));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to update customer.", error);

    return apiInternalError("Unable to update customer.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: CustomerRouteContext,
) {
  const { id } = await params;

  try {
    const prisma = getPrismaClient();
    const existingCustomer = await prisma.customer.findUnique({
      select: {
        archivedAt: true,
        id: true,
      },
      where: { id },
    });

    if (!existingCustomer) {
      return apiNotFound("Customer");
    }

    const customer = await prisma.customer.update({
      data: {
        archivedAt: existingCustomer.archivedAt ?? new Date(),
        status: CustomerStatus.ARCHIVED,
      },
      select: customerSelect,
      where: { id },
    });

    return apiOk(toCustomerApi(customer));
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return apiError(
        "DATABASE_UNAVAILABLE",
        "Database access is not configured for this environment.",
        { status: 503 },
      );
    }

    console.error("Failed to archive customer.", error);

    return apiInternalError("Unable to archive customer.");
  }
}
