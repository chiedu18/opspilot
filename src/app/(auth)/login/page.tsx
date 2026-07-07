import { redirect } from "next/navigation";

import {
  DEMO_LOGIN_EMAIL,
  DEMO_LOGIN_PASSWORD,
} from "@/lib/auth/demo-account";
import { getDemoSession } from "@/lib/auth/demo-session";

import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const loginErrors: Record<string, string> = {
  credentials: "Use the demo account credentials shown below.",
  request: "Check the demo sign-in fields and try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getDemoSession();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = params?.error ? loginErrors[params.error] : undefined;

  return (
    <main className="min-h-screen bg-[#eef2f6] px-5 py-8 text-[#18212f]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-5">
          <div>
            <p className="text-sm font-medium text-[#0f766e]">
              Self-directed portfolio project
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              OpsPilot demo workspace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475569]">
              Sign in to the fictional demo workspace backed by seeded operations
              data. This is demo authentication for the case-study project, not a
              production identity system.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["Dashboard first", "Fictional seed data", "Demo-only access"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[#d9e1ea] bg-white px-4 py-3 text-sm font-medium text-[#334155]"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[#d9e1ea] bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Demo sign in</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Uses a seeded fictional team member.
            </p>
          </div>

          <LoginForm
            demoEmail={DEMO_LOGIN_EMAIL}
            demoPassword={DEMO_LOGIN_PASSWORD}
            errorMessage={errorMessage}
          />
        </section>
      </div>
    </main>
  );
}
