import { z, type ZodError } from "zod";

import type { ApiValidationDetails } from "@/lib/api/responses";

export type ValidationResult<TData> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      details: ApiValidationDetails;
    };

const createJsonParseErrorDetails = (): ApiValidationDetails => ({
  fieldErrors: {},
  formErrors: ["Request body must be valid JSON."],
});

const issuePath = (path: PropertyKey[]) => path.map(String).join(".");

export const formatZodError = (error: ZodError): ApiValidationDetails => {
  const details: ApiValidationDetails = {
    fieldErrors: {},
    formErrors: [],
  };

  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      details.formErrors.push(issue.message);
      continue;
    }

    const fieldName = issuePath(issue.path);
    const fieldMessages = details.fieldErrors[fieldName] ?? [];
    fieldMessages.push(issue.message);
    details.fieldErrors[fieldName] = fieldMessages;
  }

  return details;
};

export const validateInput = <TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): ValidationResult<z.infer<TSchema>> => {
  const result = schema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    details: formatZodError(result.error),
  };
};

export const validateJsonBody = async <TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<ValidationResult<z.infer<TSchema>>> => {
  try {
    const body: unknown = await request.json();
    return validateInput(schema, body);
  } catch {
    return {
      success: false,
      details: createJsonParseErrorDetails(),
    };
  }
};
