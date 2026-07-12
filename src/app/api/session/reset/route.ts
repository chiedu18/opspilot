import { apiError, apiOk } from "@/lib/api/responses";
import { resetDemoSession } from "@/lib/auth/demo-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const response = apiOk({ reset: true });
  const session = await resetDemoSession(response);

  if (!session) {
    return apiError("UNAUTHORIZED", "Sign in to reset your demo workspace.", {
      status: 401,
    });
  }

  return response;
}
