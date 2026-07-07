-- CreateEnum
CREATE TYPE "team_role" AS ENUM ('OPERATIONS_MANAGER', 'ADMIN_STAFF', 'SUPPORT_STAFF', 'QA_ENGINEER', 'DEVELOPER', 'BUSINESS_OWNER');

-- CreateEnum
CREATE TYPE "team_member_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "customer_status" AS ENUM ('ACTIVE', 'PROSPECT', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "work_item_kind" AS ENUM ('ORDER', 'CAMPAIGN', 'SERVICE_REQUEST');

-- CreateEnum
CREATE TYPE "work_item_status" AS ENUM ('DRAFT', 'ACTIVE', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "inventory_category" AS ENUM ('DEVICE', 'LICENSE', 'MARKETING_ASSET', 'SKU', 'EQUIPMENT', 'TEST_ACCOUNT', 'SOFTWARE_ASSET', 'OTHER');

-- CreateEnum
CREATE TYPE "inventory_status" AS ENUM ('AVAILABLE', 'RESERVED', 'ASSIGNED', 'LOW_STOCK', 'RETIRED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "issue_category" AS ENUM ('BUG', 'SUPPORT_REQUEST', 'BLOCKER', 'FULFILLMENT', 'DATA_QUALITY', 'OTHER');

-- CreateEnum
CREATE TYPE "issue_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "activity_action" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED', 'ARCHIVED', 'RESOLVED');

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "team_role" NOT NULL DEFAULT 'SUPPORT_STAFF',
    "status" "team_member_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "customer_status" NOT NULL DEFAULT 'PROSPECT',
    "owner_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "work_item_kind" NOT NULL DEFAULT 'ORDER',
    "status" "work_item_status" NOT NULL DEFAULT 'DRAFT',
    "priority" "priority" NOT NULL DEFAULT 'MEDIUM',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "estimated_value_cents" INTEGER,
    "notes" TEXT,
    "customer_id" TEXT NOT NULL,
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "inventory_category" NOT NULL,
    "status" "inventory_status" NOT NULL DEFAULT 'AVAILABLE',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "reference_code" TEXT,
    "notes" TEXT,
    "owner_id" TEXT,
    "customer_id" TEXT,
    "work_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "issue_category" NOT NULL,
    "priority" "priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "issue_status" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "owner_id" TEXT,
    "customer_id" TEXT,
    "work_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" TEXT NOT NULL,
    "action" "activity_action" NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "actor_id" TEXT,
    "customer_id" TEXT,
    "work_item_id" TEXT,
    "inventory_item_id" TEXT,
    "issue_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_members_email_key" ON "team_members"("email");

-- CreateIndex
CREATE INDEX "team_members_role_idx" ON "team_members"("role");

-- CreateIndex
CREATE INDEX "team_members_status_idx" ON "team_members"("status");

-- CreateIndex
CREATE INDEX "team_members_archived_at_idx" ON "team_members"("archived_at");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "customers_owner_id_idx" ON "customers"("owner_id");

-- CreateIndex
CREATE INDEX "customers_archived_at_idx" ON "customers"("archived_at");

-- CreateIndex
CREATE INDEX "work_items_customer_id_idx" ON "work_items"("customer_id");

-- CreateIndex
CREATE INDEX "work_items_owner_id_idx" ON "work_items"("owner_id");

-- CreateIndex
CREATE INDEX "work_items_status_idx" ON "work_items"("status");

-- CreateIndex
CREATE INDEX "work_items_priority_idx" ON "work_items"("priority");

-- CreateIndex
CREATE INDEX "work_items_due_date_idx" ON "work_items"("due_date");

-- CreateIndex
CREATE INDEX "work_items_archived_at_idx" ON "work_items"("archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_reference_code_key" ON "inventory_items"("reference_code");

-- CreateIndex
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("status");

-- CreateIndex
CREATE INDEX "inventory_items_owner_id_idx" ON "inventory_items"("owner_id");

-- CreateIndex
CREATE INDEX "inventory_items_customer_id_idx" ON "inventory_items"("customer_id");

-- CreateIndex
CREATE INDEX "inventory_items_work_item_id_idx" ON "inventory_items"("work_item_id");

-- CreateIndex
CREATE INDEX "inventory_items_archived_at_idx" ON "inventory_items"("archived_at");

-- CreateIndex
CREATE INDEX "issues_category_idx" ON "issues"("category");

-- CreateIndex
CREATE INDEX "issues_priority_idx" ON "issues"("priority");

-- CreateIndex
CREATE INDEX "issues_status_idx" ON "issues"("status");

-- CreateIndex
CREATE INDEX "issues_owner_id_idx" ON "issues"("owner_id");

-- CreateIndex
CREATE INDEX "issues_customer_id_idx" ON "issues"("customer_id");

-- CreateIndex
CREATE INDEX "issues_work_item_id_idx" ON "issues"("work_item_id");

-- CreateIndex
CREATE INDEX "issues_archived_at_idx" ON "issues"("archived_at");

-- CreateIndex
CREATE INDEX "activity_events_action_idx" ON "activity_events"("action");

-- CreateIndex
CREATE INDEX "activity_events_actor_id_idx" ON "activity_events"("actor_id");

-- CreateIndex
CREATE INDEX "activity_events_customer_id_idx" ON "activity_events"("customer_id");

-- CreateIndex
CREATE INDEX "activity_events_work_item_id_idx" ON "activity_events"("work_item_id");

-- CreateIndex
CREATE INDEX "activity_events_inventory_item_id_idx" ON "activity_events"("inventory_item_id");

-- CreateIndex
CREATE INDEX "activity_events_issue_id_idx" ON "activity_events"("issue_id");

-- CreateIndex
CREATE INDEX "activity_events_created_at_idx" ON "activity_events"("created_at");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_work_item_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_work_item_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_work_item_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
