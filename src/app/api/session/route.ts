import { NextResponse } from "next/server";
import { z } from "zod";

import {
  DEMO_USER,
  validateDemoCredentials,
} from "@/lib/auth/demo-account";
import {
  clearDemoSessionCookie,
  getDemoSession,
  setDemoSessionCookie,
} from "@/lib/auth/demo-session";
import { apiError, apiOk, apiValidationError } from "@/lib/api/responses";
import { getSameOriginUrl } from "@/lib/http/redirects";
import { validateInput, validateJsonBody } from "@/lib/validation/request";

const demoLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter the demo account email address.")),
  password: z.string().min(1, "Enter the demo password."),
});

const isFormSubmission = (request: Request) => {
  const contentType = request.headers.get("content-type") ?? "";

  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
};

const redirectToLogin = (request: Request, error: "credentials" | "request") => {
  const url = getSameOriginUrl(request, "/login");
  url.searchParams.set("error", error);

  return NextResponse.redirect(url, { status: 303 });
};

export async function GET() {
  const session = await getDemoSession();

  return apiOk({
    authenticated: Boolean(session),
    user: session?.user ?? null,
  });
}

export async function POST(request: Request) {
  const isForm = isFormSubmission(request);
  const validation = isForm
    ? validateInput(
        demoLoginSchema,
        Object.fromEntries(await request.formData()),
      )
    : await validateJsonBody(request, demoLoginSchema);

  if (!validation.success) {
    if (isForm) {
      return redirectToLogin(request, "request");
    }

    return apiValidationError(validation.details);
  }

  if (!validateDemoCredentials(validation.data)) {
    if (isForm) {
      return redirectToLogin(request, "credentials");
    }

    return apiError(
      "INVALID_CREDENTIALS",
      "Use the demo account credentials shown on the login page.",
      { status: 401 },
    );
  }

  const response = isForm
    ? NextResponse.redirect(getSameOriginUrl(request, "/dashboard"), {
        status: 303,
      })
    : apiOk({
        user: DEMO_USER,
      });

  setDemoSessionCookie(response);

  return response;
}

export async function DELETE() {
  const response = apiOk({
    signedOut: true,
  });

  clearDemoSessionCookie(response);

  return response;
}
