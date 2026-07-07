import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import {
  DEMO_SESSION_COOKIE_NAME,
  DEMO_SESSION_COOKIE_VALUE,
  DEMO_SESSION_MAX_AGE_SECONDS,
  getDemoSessionFromCookieValue,
} from "@/lib/auth/demo-account";

const demoSessionCookieOptions = {
  httpOnly: true,
  maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export const getDemoSession = async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(DEMO_SESSION_COOKIE_NAME)?.value;

  return getDemoSessionFromCookieValue(cookieValue);
};

export const setDemoSessionCookie = (response: NextResponse) => {
  response.cookies.set(
    DEMO_SESSION_COOKIE_NAME,
    DEMO_SESSION_COOKIE_VALUE,
    demoSessionCookieOptions,
  );
};

export const clearDemoSessionCookie = (response: NextResponse) => {
  response.cookies.set(DEMO_SESSION_COOKIE_NAME, "", {
    ...demoSessionCookieOptions,
    maxAge: 0,
  });
};
