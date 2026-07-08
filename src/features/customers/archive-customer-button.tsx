"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ArchiveCustomerButtonProps = {
  customerId: string;
  customerName: string;
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

  return "The customer could not be archived. Try again.";
};

export function ArchiveCustomerButton({
  customerId,
  customerName,
  redirectTo = "/customers?archived=1",
}: ArchiveCustomerButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const archiveCustomer = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const response = await fetch(`/api/customers/${customerId}`, {
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
        aria-label={`Archive ${customerName}`}
        className="rounded-lg border border-[#fecaca] px-3 py-2 text-sm font-semibold text-[#b91c1c] hover:bg-[#fef2f2] focus:outline-none focus:ring-2 focus:ring-[#fecaca]"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Archive
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/30 px-4 py-6">
          <div
            aria-labelledby="archive-customer-title"
            aria-modal="true"
            className="w-full max-w-md rounded-lg border border-[#d9e1ea] bg-white p-5 shadow-xl"
            role="dialog"
          >
            <div>
              <p className="text-sm font-semibold text-[#b91c1c]">
                Archive customer
              </p>
              <h2
                className="mt-1 text-lg font-semibold text-[#18212f]"
                id="archive-customer-title"
              >
                {customerName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                This removes the customer from the default operations list while
                retaining the record for related work and reporting.
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
                className="rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#b91c1c] px-3 py-2 text-sm font-semibold text-white hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:bg-[#fca5a5]"
                disabled={isSubmitting}
                onClick={archiveCustomer}
                type="button"
              >
                {isSubmitting ? "Archiving" : "Archive customer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
