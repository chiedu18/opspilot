import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { DemoUser } from "@/lib/auth/demo-account";

import { AppNavigation } from "./app-navigation";
import { SignOutButton } from "./sign-out-button";

export function AppShell({
  children,
  user,
}: Readonly<{ children: React.ReactNode; user: DemoUser }>) {
  return (
    <div className="op-app-root min-h-screen">
      <div className="op-app-frame grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="op-app-sidebar min-w-0 px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <div className="flex min-w-0 items-center justify-between gap-4 lg:block">
            <Link
              href="/dashboard"
              className="op-brand-link op-focus-ring block rounded-md"
            >
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="op-brand-mark">OP</span>
                <div>
                  <div className="text-lg font-semibold tracking-[-0.03em]">OpsPilot</div>
                  <div className="mt-0.5 text-xs">Operations command center</div>
                </div>
              </div>
            </Link>
            <StatusBadge className="op-demo-badge lg:mt-8" tone="demo">
              Demo workspace
            </StatusBadge>
          </div>

          <AppNavigation />
        </aside>

        <div className="op-workspace min-w-0">
          <header className="op-app-header px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="op-header-eyebrow">
                  Self-directed portfolio project
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
                  Internal operations dashboard
                </h1>
              </div>
              <div className="op-account-context flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                <span>
                  Signed in as{" "}
                  <span className="font-medium text-[#334155]">
                    {user.name}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <SignOutButton />
                </div>
              </div>
            </div>
          </header>

          <main className="op-page-enter px-5 py-7 sm:px-8 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
