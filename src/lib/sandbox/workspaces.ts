import { createHash, randomBytes } from "node:crypto";

import { Prisma, SandboxWorkspaceKind } from "@/generated/prisma/client";
import { DEMO_SESSION_MAX_AGE_SECONDS } from "@/lib/auth/demo-account";
import { getPrismaClient } from "@/lib/db/prisma";

export const CANONICAL_WORKSPACE_ID = "workspace-canonical-demo";

type DatabaseClient = Prisma.TransactionClient;

const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const getExpiry = () =>
  new Date(Date.now() + DEMO_SESSION_MAX_AGE_SECONDS * 1000);

const mappedId = (ids: Map<string, string>, id: string | null) =>
  id ? (ids.get(id) ?? null) : null;

const cloneCanonicalWorkspace = async (tx: DatabaseClient, expiresAt: Date) => {
  const workspace = await tx.sandboxWorkspace.create({
    data: { kind: SandboxWorkspaceKind.SANDBOX, expiresAt },
    select: { id: true },
  });

  const [customers, workItems, inventoryItems, issues, activityEvents] =
    await Promise.all([
      tx.customer.findMany({
        where: { workspaceId: CANONICAL_WORKSPACE_ID },
      }),
      tx.workItem.findMany({
        where: { workspaceId: CANONICAL_WORKSPACE_ID },
      }),
      tx.inventoryItem.findMany({
        where: { workspaceId: CANONICAL_WORKSPACE_ID },
      }),
      tx.issue.findMany({ where: { workspaceId: CANONICAL_WORKSPACE_ID } }),
      tx.activityEvent.findMany({
        where: { workspaceId: CANONICAL_WORKSPACE_ID },
      }),
    ]);

  const customerIds = new Map<string, string>();
  for (const customer of customers) {
    const clone = await tx.customer.create({
      data: {
        name: customer.name,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        ownerId: customer.ownerId,
        notes: customer.notes,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        archivedAt: customer.archivedAt,
        workspaceId: workspace.id,
      },
      select: { id: true },
    });
    customerIds.set(customer.id, clone.id);
  }

  const workItemIds = new Map<string, string>();
  for (const workItem of workItems) {
    const clone = await tx.workItem.create({
      data: {
        title: workItem.title,
        kind: workItem.kind,
        status: workItem.status,
        priority: workItem.priority,
        dueDate: workItem.dueDate,
        completedAt: workItem.completedAt,
        estimatedValueCents: workItem.estimatedValueCents,
        notes: workItem.notes,
        customerId: customerIds.get(workItem.customerId)!,
        ownerId: workItem.ownerId,
        createdAt: workItem.createdAt,
        updatedAt: workItem.updatedAt,
        archivedAt: workItem.archivedAt,
        workspaceId: workspace.id,
      },
      select: { id: true },
    });
    workItemIds.set(workItem.id, clone.id);
  }

  const inventoryItemIds = new Map<string, string>();
  for (const inventoryItem of inventoryItems) {
    const clone = await tx.inventoryItem.create({
      data: {
        name: inventoryItem.name,
        category: inventoryItem.category,
        status: inventoryItem.status,
        quantity: inventoryItem.quantity,
        lowStockThreshold: inventoryItem.lowStockThreshold,
        location: inventoryItem.location,
        referenceCode: inventoryItem.referenceCode,
        notes: inventoryItem.notes,
        ownerId: inventoryItem.ownerId,
        customerId: mappedId(customerIds, inventoryItem.customerId),
        workItemId: mappedId(workItemIds, inventoryItem.workItemId),
        createdAt: inventoryItem.createdAt,
        updatedAt: inventoryItem.updatedAt,
        archivedAt: inventoryItem.archivedAt,
        workspaceId: workspace.id,
      },
      select: { id: true },
    });
    inventoryItemIds.set(inventoryItem.id, clone.id);
  }

  const issueIds = new Map<string, string>();
  for (const issue of issues) {
    const clone = await tx.issue.create({
      data: {
        title: issue.title,
        category: issue.category,
        priority: issue.priority,
        status: issue.status,
        description: issue.description,
        resolutionNotes: issue.resolutionNotes,
        resolvedAt: issue.resolvedAt,
        ownerId: issue.ownerId,
        customerId: mappedId(customerIds, issue.customerId),
        workItemId: mappedId(workItemIds, issue.workItemId),
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        archivedAt: issue.archivedAt,
        workspaceId: workspace.id,
      },
      select: { id: true },
    });
    issueIds.set(issue.id, clone.id);
  }

  await tx.activityEvent.createMany({
    data: activityEvents.map((activityEvent) => ({
      action: activityEvent.action,
      summary: activityEvent.summary,
      metadata: activityEvent.metadata ?? undefined,
      actorId: activityEvent.actorId,
      customerId: mappedId(customerIds, activityEvent.customerId),
      workItemId: mappedId(workItemIds, activityEvent.workItemId),
      inventoryItemId: mappedId(inventoryItemIds, activityEvent.inventoryItemId),
      issueId: mappedId(issueIds, activityEvent.issueId),
      createdAt: activityEvent.createdAt,
      workspaceId: workspace.id,
    })),
  });

  return workspace.id;
};

export const removeExpiredSandboxes = async () => {
  const prisma = getPrismaClient();
  await prisma.sandboxWorkspace.deleteMany({
    where: {
      kind: SandboxWorkspaceKind.SANDBOX,
      expiresAt: { lt: new Date() },
    },
  });
};

export const createSandboxSession = async () => {
  const prisma = getPrismaClient();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = getExpiry();

  const session = await prisma.$transaction(async (tx) => {
    await tx.sandboxWorkspace.deleteMany({
      where: {
        kind: SandboxWorkspaceKind.SANDBOX,
        expiresAt: { lt: new Date() },
      },
    });
    const workspaceId = await cloneCanonicalWorkspace(tx, expiresAt);
    return tx.demoSession.create({
      data: { tokenHash, workspaceId, expiresAt },
      select: { workspaceId: true, expiresAt: true },
    });
  });

  return { token, ...session };
};

export const findSandboxSession = async (token: string | undefined) => {
  if (!token) {
    return null;
  }

  const prisma = getPrismaClient();
  const session = await prisma.demoSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      workspaceId: true,
      expiresAt: true,
      workspace: { select: { kind: true, expiresAt: true } },
    },
  });

  if (
    !session ||
    session.expiresAt <= new Date() ||
    session.workspace.kind !== SandboxWorkspaceKind.SANDBOX ||
    session.workspace.expiresAt === null ||
    session.workspace.expiresAt <= new Date()
  ) {
    return null;
  }

  return { workspaceId: session.workspaceId, expiresAt: session.expiresAt };
};

export const resetSandboxSession = async (token: string | undefined) => {
  if (!token) {
    return null;
  }

  const prisma = getPrismaClient();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getExpiry();

  return prisma.$transaction(async (tx) => {
    const session = await tx.demoSession.findUnique({
      where: { tokenHash },
      select: { workspaceId: true, expiresAt: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      return null;
    }

    const workspaceId = await cloneCanonicalWorkspace(tx, expiresAt);
    await tx.demoSession.update({
      where: { tokenHash },
      data: { workspaceId, expiresAt },
    });
    await tx.sandboxWorkspace.delete({ where: { id: session.workspaceId } });

    return { workspaceId, expiresAt };
  });
};
