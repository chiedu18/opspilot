import { NextResponse } from "next/server";

type ApiSuccessPayload<TData> = {
  data: TData;
};

export type ApiFieldErrors = Record<string, string[]>;

export type ApiValidationDetails = {
  fieldErrors: ApiFieldErrors;
  formErrors: string[];
};

type ApiErrorPayload<TDetails = unknown> = {
  error: {
    code: string;
    message: string;
    details?: TDetails;
  };
};

export const apiOk = <TData>(data: TData, init?: ResponseInit) =>
  NextResponse.json<ApiSuccessPayload<TData>>({ data }, init);

export const apiError = (
  code: string,
  message: string,
  init: ResponseInit = { status: 500 },
  details?: unknown,
) => {
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };

  return NextResponse.json(payload, init);
};

export const apiValidationError = (details: ApiValidationDetails) =>
  apiError(
    "VALIDATION_ERROR",
    "Please check the highlighted fields.",
    { status: 400 },
    details,
  );

export const apiNotFound = (resourceName = "Record") =>
  apiError("NOT_FOUND", `${resourceName} was not found.`, { status: 404 });

export const apiInternalError = (
  message = "Something went wrong. Please try again.",
) => apiError("INTERNAL_ERROR", message, { status: 500 });
