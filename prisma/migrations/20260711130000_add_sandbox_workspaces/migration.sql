-- Isolated visitor workspaces protect the canonical demo data from public writes.
CREATE TYPE "sandbox_workspace_kind" AS ENUM ('CANONICAL', 'SANDBOX');

CREATE TABLE "sandbox_workspaces" (
    "id" TEXT NOT NULL,
    "kind" "sandbox_workspace_kind" NOT NULL DEFAULT 'SANDBOX',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sandbox_workspaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "demo_sessions" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "demo_sessions_pkey" PRIMARY KEY ("id")
);

INSERT INTO "sandbox_workspaces" ("id", "kind", "created_at", "updated_at")
VALUES ('workspace-canonical-demo', 'CANONICAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "customers" ADD COLUMN "workspace_id" TEXT;
ALTER TABLE "work_items" ADD COLUMN "workspace_id" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "workspace_id" TEXT;
ALTER TABLE "issues" ADD COLUMN "workspace_id" TEXT;
ALTER TABLE "activity_events" ADD COLUMN "workspace_id" TEXT;

UPDATE "customers" SET "workspace_id" = 'workspace-canonical-demo' WHERE "workspace_id" IS NULL;
UPDATE "work_items" SET "workspace_id" = 'workspace-canonical-demo' WHERE "workspace_id" IS NULL;
UPDATE "inventory_items" SET "workspace_id" = 'workspace-canonical-demo' WHERE "workspace_id" IS NULL;
UPDATE "issues" SET "workspace_id" = 'workspace-canonical-demo' WHERE "workspace_id" IS NULL;
UPDATE "activity_events" SET "workspace_id" = 'workspace-canonical-demo' WHERE "workspace_id" IS NULL;

ALTER TABLE "customers" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "work_items" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "inventory_items" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "issues" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "activity_events" ALTER COLUMN "workspace_id" SET NOT NULL;

DROP INDEX "inventory_items_reference_code_key";

CREATE UNIQUE INDEX "demo_sessions_token_hash_key" ON "demo_sessions"("token_hash");
CREATE INDEX "demo_sessions_expires_at_idx" ON "demo_sessions"("expires_at");
CREATE INDEX "demo_sessions_workspace_id_idx" ON "demo_sessions"("workspace_id");
CREATE INDEX "sandbox_workspaces_expires_at_idx" ON "sandbox_workspaces"("expires_at");
CREATE INDEX "sandbox_workspaces_kind_idx" ON "sandbox_workspaces"("kind");
CREATE INDEX "customers_workspace_id_idx" ON "customers"("workspace_id");
CREATE INDEX "work_items_workspace_id_idx" ON "work_items"("workspace_id");
CREATE INDEX "inventory_items_workspace_id_idx" ON "inventory_items"("workspace_id");
CREATE INDEX "issues_workspace_id_idx" ON "issues"("workspace_id");
CREATE INDEX "activity_events_workspace_id_idx" ON "activity_events"("workspace_id");
CREATE UNIQUE INDEX "inventory_items_workspace_id_reference_code_key" ON "inventory_items"("workspace_id", "reference_code");

ALTER TABLE "demo_sessions" ADD CONSTRAINT "demo_sessions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "sandbox_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "sandbox_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "sandbox_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "sandbox_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "sandbox_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "sandbox_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
