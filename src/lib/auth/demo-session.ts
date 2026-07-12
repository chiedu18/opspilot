import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import {
  DEMO_SESSION_COOKIE_NAME,
  DEMO_SESSION_MAX_AGE_SECONDS,
  DEMO_USER,
} from "@/lib/auth/demo-account";
import {
  createSandboxSession,
  findSandboxSession,
  resetSandboxSession,
} from "@/lib/sandbox/workspaces";

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
  const sandbox = await findSandboxSession(cookieValue);

  return sandbox
    ? {
        user: DEMO_USER,
        ...sandbox,
      }
    : null;
};

export const setDemoSessionCookie = async (response: NextResponse) => {
  const session = await createSandboxSession();
  response.cookies.set(
    DEMO_SESSION_COOKIE_NAME,
    session.token,
    demoSessionCookieOptions,
  );

  return session;
};

export const resetDemoSession = async (response: NextResponse) => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(DEMO_SESSION_COOKIE_NAME)?.value;
  const session = await resetSandboxSession(cookieValue);

  if (!session) {
    return null;
  }

  response.cookies.set(DEMO_SESSION_COOKIE_NAME, cookieValue!, demoSessionCookieOptions);
  return session;
};

export const clearDemoSessionCookie = (response: NextResponse) => {
  response.cookies.set(DEMO_SESSION_COOKIE_NAME, "", {
    ...demoSessionCookieOptions,
    maxAge: 0,
  });
};
