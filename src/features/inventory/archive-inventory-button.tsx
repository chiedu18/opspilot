"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ArchiveInventoryButtonProps = {
  inventoryId: string;
  inventoryName: string;
  redirectTo?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readErrorMessage = async (response: Response) => {
  const payload: unknown = await response.json().catch(() => null);

  if (
    isRecord(payload) &&
    isRecord(payload.error) &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return "The inventory item could not be archived. Try again.";
};

export function ArchiveInventoryButton({
  inventoryId,
  inventoryName,
  redirectTo = "/inventory?archived=1",
}: ArchiveInventoryButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const archiveInventoryItem = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const response = await fetch(`/api/inventory/${inventoryId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setErrorMessage(await readErrorMessage(response));
      setIsSubmitting(false);
      return;
    }

    router.push(redirectTo);
  };

  return (
    <>
      <button
        aria-label={`Archive ${inventoryName}`}
        className="op-button op-button-danger-subtle px-3"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Archive
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/30 px-4 py-6">
          <div
            aria-labelledby="archive-inventory-title"
            aria-modal="true"
            className="op-archive-dialog op-static-card w-full max-w-md rounded-lg p-5 shadow-[var(--shadow-modal)]"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !isSubmitting) setIsOpen(false);
            }}
            role="dialog"
          >
            <div>
              <p className="text-sm font-semibold text-[#b91c1c]">
                Archive inventory item
              </p>
              <h2
                className="mt-1 text-lg font-semibold text-[#18212f]"
                id="archive-inventory-title"
              >
                {inventoryName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                This removes the item from default inventory views while
                retaining it for related orders, issues, activity, and reporting.
              </p>
            </div>

            {errorMessage ? (
              <div
                className="mt-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]"
                role="alert"
              >
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                autoFocus
                className="op-button op-button-secondary px-3"
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                aria-busy={isSubmitting || undefined}
                className="op-button op-button-danger px-3"
                data-pending={isSubmitting || undefined}
                disabled={isSubmitting}
                onClick={archiveInventoryItem}
                type="button"
              >
                {isSubmitting ? "Archiving" : "Archive inventory item"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
