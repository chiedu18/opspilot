import { NextResponse, type NextRequest } from "next/server";

import { clearDemoSessionCookie } from "@/lib/auth/demo-session";
import { getSameOriginUrl } from "@/lib/http/redirects";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(getSameOriginUrl(request, "/login"));
  clearDemoSessionCookie(response);

  return response;
}
