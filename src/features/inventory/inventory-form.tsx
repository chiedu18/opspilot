"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import {
  inventoryCategoryOptions,
  inventoryStatusOptions,
  type InventoryCustomerChoice,
  type InventoryFormValues,
  type InventoryOwnerChoice,
  type InventoryWorkItemChoice,
} from "./inventory-ui";

type InventoryFormProps = {
  action: string;
  cancelHref: string;
  customers: InventoryCustomerChoice[];
  initialValues: InventoryFormValues;
  method: "PATCH" | "POST";
  mode: "create" | "edit";
  owners: InventoryOwnerChoice[];
  workItems: InventoryWorkItemChoice[];
};

type FieldErrors = Partial<Record<keyof InventoryFormValues, string[]>>;

const fieldNames = [
  "name",
  "category",
  "status",
  "quantity",
  "lowStockThreshold",
  "location",
  "referenceCode",
  "ownerId",
  "customerId",
  "workItemId",
  "notes",
] as const satisfies readonly (keyof InventoryFormValues)[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const nullableText = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const wholeNumberValue = (value: string) => {
  const trimmed = value.trim();

  if (trimmed === "") {
    return "";
  }

  return Number(trimmed);
};

const readSuccessInventoryId = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  return typeof payload.data.id === "string" ? payload.data.id : null;
};

const readApiError = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return {
      fieldErrors: {},
      formErrors: ["The inventory item could not be saved. Try again."],
    };
  }

  const details = payload.error.details;
  const fieldErrors: FieldErrors = {};
  const formErrors: string[] = [];

  if (isRecord(details)) {
    const apiFieldErrors = details.fieldErrors;

    if (isRecord(apiFieldErrors)) {
      for (const fieldName of fieldNames) {
        const messages = apiFieldErrors[fieldName];

        if (
          Array.isArray(messages) &&
          messages.every((message) => typeof message === "string")
        ) {
          fieldErrors[fieldName] = messages;
        }
      }
    }

    const apiFormErrors = details.formErrors;

    if (
      Array.isArray(apiFormErrors) &&
      apiFormErrors.every((message) => typeof message === "string")
    ) {
      formErrors.push(...apiFormErrors);
    }
  }

  if (typeof payload.error.message === "string" && formErrors.length === 0) {
    formErrors.push(payload.error.message);
  }

  return { fieldErrors, formErrors };
};

export function InventoryForm({
  action,
  cancelHref,
  customers,
  initialValues,
  method,
  mode,
  owners,
  workItems,
}: InventoryFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<InventoryFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormDisabled = isSubmitting || !isReady;

  useEffect(() => {
    const readyTimer = window.setTimeout(() => setIsReady(true), 0);

    return () => window.clearTimeout(readyTimer);
  }, []);

  const updateValue = <TField extends keyof InventoryFormValues>(
    field: TField,
    value: InventoryFormValues[TField],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateCustomer = (customerId: string) => {
    setValues((current) => {
      const selectedWorkItem = workItems.find(
        (workItem) => workItem.id === current.workItemId,
      );

      return {
        ...current,
        customerId,
        workItemId:
          selectedWorkItem && selectedWorkItem.customerId !== customerId
            ? ""
            : current.workItemId,
      };
    });
    setFieldErrors((current) => ({
      ...current,
      customerId: undefined,
      workItemId: undefined,
    }));
  };

  const updateWorkItem = (workItemId: string) => {
    const selectedWorkItem = workItems.find(
      (workItem) => workItem.id === workItemId,
    );

    setValues((current) => ({
      ...current,
      customerId: selectedWorkItem?.customerId ?? current.customerId,
      workItemId,
    }));
    setFieldErrors((current) => ({
      ...current,
      customerId: undefined,
      workItemId: undefined,
    }));
  };

  const fieldError = (field: keyof InventoryFormValues) =>
    fieldErrors[field]?.[0];

  const inputClass = (field: keyof InventoryFormValues) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#99f6e4] ${
      fieldError(field) ? "border-[#fca5a5]" : "border-[#cbd5e1]"
    }`;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setFormErrors([]);

    const response = await fetch(action, {
      body: JSON.stringify({
        category: values.category,
        customerId: nullableText(values.customerId),
        location: nullableText(values.location),
        lowStockThreshold: wholeNumberValue(values.lowStockThreshold),
        name: values.name,
        notes: nullableText(values.notes),
        ownerId: nullableText(values.ownerId),
        quantity: wholeNumberValue(values.quantity),
        referenceCode: nullableText(values.referenceCode),
        status: values.status,
        workItemId: nullableText(values.workItemId),
      }),
      headers: { "Content-Type": "application/json" },
      method,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const apiError = readApiError(payload);
      setFieldErrors(apiError.fieldErrors);
      setFormErrors(apiError.formErrors);
      setIsSubmitting(false);
      return;
    }

    const inventoryId = readSuccessInventoryId(payload);

    if (!inventoryId) {
      setFormErrors([
        "The inventory item was saved, but the response was incomplete.",
      ]);
      setIsSubmitting(false);
      return;
    }

    router.push(
      `/inventory/${inventoryId}?${mode === "create" ? "created" : "saved"}=1`,
    );
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {formErrors.length > 0 ? (
        <div
          className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]"
          role="alert"
        >
          {formErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="text-sm font-medium text-[#334155]" htmlFor="name">
            Name
          </label>
          <input
            aria-describedby={fieldError("name") ? "name-error" : undefined}
            aria-invalid={Boolean(fieldError("name"))}
            className={inputClass("name")}
            disabled={isFormDisabled}
            id="name"
            name="name"
            onChange={(event) => updateValue("name", event.target.value)}
            value={values.name}
          />
          {fieldError("name") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="name-error">
              {fieldError("name")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="category"
          >
            Category
          </label>
          <select
            aria-describedby={
              fieldError("category") ? "category-error" : undefined
            }
            aria-invalid={Boolean(fieldError("category"))}
            className={inputClass("category")}
            disabled={isFormDisabled}
            id="category"
            name="category"
            onChange={(event) =>
              updateValue(
                "category",
                event.target.value as InventoryFormValues["category"],
              )
            }
            value={values.category}
          >
            {inventoryCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError("category") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="category-error">
              {fieldError("category")}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[#334155]" htmlFor="status">
            Status
          </label>
          <select
            aria-describedby={fieldError("status") ? "status-error" : undefined}
            aria-invalid={Boolean(fieldError("status"))}
            className={inputClass("status")}
            disabled={isFormDisabled}
            id="status"
            name="status"
            onChange={(event) =>
              updateValue(
                "status",
                event.target.value as InventoryFormValues["status"],
              )
            }
            value={values.status}
          >
            {inventoryStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError("status") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="status-error">
              {fieldError("status")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="quantity"
          >
            Quantity
          </label>
          <input
            aria-describedby={
              fieldError("quantity") ? "quantity-error" : undefined
            }
            aria-invalid={Boolean(fieldError("quantity"))}
            className={inputClass("quantity")}
            disabled={isFormDisabled}
            id="quantity"
            inputMode="numeric"
            name="quantity"
            onChange={(event) => updateValue("quantity", event.target.value)}
            type="number"
            value={values.quantity}
          />
          {fieldError("quantity") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="quantity-error">
              {fieldError("quantity")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="lowStockThreshold"
          >
            Low-stock threshold
          </label>
          <input
            aria-describedby={
              fieldError("lowStockThreshold")
                ? "lowStockThreshold-error"
                : undefined
            }
            aria-invalid={Boolean(fieldError("lowStockThreshold"))}
            className={inputClass("lowStockThreshold")}
            disabled={isFormDisabled}
            id="lowStockThreshold"
            inputMode="numeric"
            name="lowStockThreshold"
            onChange={(event) =>
              updateValue("lowStockThreshold", event.target.value)
            }
            type="number"
            value={values.lowStockThreshold}
          />
          {fieldError("lowStockThreshold") ? (
            <p
              className="mt-1 text-xs text-[#b91c1c]"
              id="lowStockThreshold-error"
            >
              {fieldError("lowStockThreshold")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="referenceCode"
          >
            Reference code
          </label>
          <input
            aria-describedby={
              fieldError("referenceCode") ? "referenceCode-error" : undefined
            }
            aria-invalid={Boolean(fieldError("referenceCode"))}
            className={inputClass("referenceCode")}
            disabled={isFormDisabled}
            id="referenceCode"
            name="referenceCode"
            onChange={(event) =>
              updateValue("referenceCode", event.target.value)
            }
            value={values.referenceCode}
          />
          {fieldError("referenceCode") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="referenceCode-error">
              {fieldError("referenceCode")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="location"
          >
            Location
          </label>
          <input
            aria-describedby={
              fieldError("location") ? "location-error" : undefined
            }
            aria-invalid={Boolean(fieldError("location"))}
            className={inputClass("location")}
            disabled={isFormDisabled}
            id="location"
            name="location"
            onChange={(event) => updateValue("location", event.target.value)}
            value={values.location}
          />
          {fieldError("location") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="location-error">
              {fieldError("location")}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[#334155]" htmlFor="ownerId">
            Owner
          </label>
          <select
            aria-describedby={fieldError("ownerId") ? "ownerId-error" : undefined}
            aria-invalid={Boolean(fieldError("ownerId"))}
            className={inputClass("ownerId")}
            disabled={isFormDisabled}
            id="ownerId"
            name="ownerId"
            onChange={(event) => updateValue("ownerId", event.target.value)}
            value={values.ownerId}
          >
            <option value="">Unassigned</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
                {owner.status !== "ACTIVE" ? " (inactive)" : ""}
              </option>
            ))}
          </select>
          {fieldError("ownerId") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="ownerId-error">
              {fieldError("ownerId")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="customerId"
          >
            Customer
          </label>
          <select
            aria-describedby={
              fieldError("customerId") ? "customerId-error" : undefined
            }
            aria-invalid={Boolean(fieldError("customerId"))}
            className={inputClass("customerId")}
            disabled={isFormDisabled}
            id="customerId"
            name="customerId"
            onChange={(event) => updateCustomer(event.target.value)}
            value={values.customerId}
          >
            <option value="">No customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.archivedAt || customer.status === "ARCHIVED"
                  ? " (archived)"
                  : ""}
              </option>
            ))}
          </select>
          {fieldError("customerId") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="customerId-error">
              {fieldError("customerId")}
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <label
            className="text-sm font-medium text-[#334155]"
            htmlFor="workItemId"
          >
            Related order
          </label>
          <select
            aria-describedby={
              fieldError("workItemId") ? "workItemId-error" : undefined
            }
            aria-invalid={Boolean(fieldError("workItemId"))}
            className={inputClass("workItemId")}
            disabled={isFormDisabled}
            id="workItemId"
            name="workItemId"
            onChange={(event) => updateWorkItem(event.target.value)}
            value={values.workItemId}
          >
            <option value="">No related order</option>
            {workItems.map((workItem) => (
              <option key={workItem.id} value={workItem.id}>
                {workItem.title} - {workItem.customer.name}
                {workItem.archivedAt ? " (archived)" : ""}
              </option>
            ))}
          </select>
          {fieldError("workItemId") ? (
            <p className="mt-1 text-xs text-[#b91c1c]" id="workItemId-error">
              {fieldError("workItemId")}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-[#334155]" htmlFor="notes">
          Notes
        </label>
        <textarea
          aria-describedby={fieldError("notes") ? "notes-error" : undefined}
          aria-invalid={Boolean(fieldError("notes"))}
          className={`${inputClass("notes")} min-h-32 resize-y`}
          disabled={isFormDisabled}
          id="notes"
          name="notes"
          onChange={(event) => updateValue("notes", event.target.value)}
          value={values.notes}
        />
        {fieldError("notes") ? (
          <p className="mt-1 text-xs text-[#b91c1c]" id="notes-error">
            {fieldError("notes")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#d9e1ea] pt-4 sm:flex-row sm:justify-end">
        <Link
          className="rounded-lg border border-[#cbd5e1] px-4 py-2 text-center text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
          href={cancelHref}
        >
          Cancel
        </Link>
        <button
          className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115e59] disabled:cursor-not-allowed disabled:bg-[#94a3b8]"
          disabled={isFormDisabled}
          type="submit"
        >
          {!isReady
            ? "Preparing form"
            : isSubmitting
              ? "Saving inventory"
              : mode === "create"
                ? "Create inventory item"
                : "Save changes"}
        </button>
      </div>
    </form>
  );
}
