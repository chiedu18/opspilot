import { redirect } from "next/navigation";

import { ThemeToggle } from "@/components/ui/theme-toggle";
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
    <main className="op-login-page relative min-h-screen px-5 py-8 text-[#18212f]">
      <div className="op-login-theme-control">
        <ThemeToggle />
      </div>
      <div className="op-login-layout mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="op-login-intro op-section-enter space-y-7">
          <div>
            <p className="op-header-eyebrow">
              Self-directed portfolio project
            </p>
            <h1 className="mt-3 max-w-xl text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
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
                  className="op-login-signal rounded-2xl px-4 py-4 text-sm font-semibold"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </section>

        <section className="op-login-card op-section-enter rounded-3xl p-6 sm:p-7">
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
