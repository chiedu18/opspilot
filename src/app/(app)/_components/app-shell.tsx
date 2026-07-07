import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { DemoUser } from "@/lib/auth/demo-account";

import { AppNavigation } from "./app-navigation";
import { SignOutButton } from "./sign-out-button";

export function AppShell({
  children,
  user,
}: Readonly<{ children: React.ReactNode; user: DemoUser }>) {
  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#18212f]">
      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-[#d9e1ea] bg-white px-5 py-4 lg:border-b-0 lg:border-r">
          <div className="flex min-w-0 items-center justify-between gap-4 lg:block">
            <Link href="/dashboard" className="block">
              <div className="text-lg font-semibold">OpsPilot</div>
              <div className="mt-1 text-sm text-[#64748b]">Operations desk</div>
            </Link>
            <StatusBadge className="lg:mt-6" tone="demo">
              Demo workspace
            </StatusBadge>
          </div>

          <AppNavigation />
        </aside>

        <div className="min-w-0">
          <header className="border-b border-[#d9e1ea] bg-white px-5 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-[#0f766e]">
                  Self-directed portfolio project
                </p>
                <h1 className="mt-1 text-2xl font-semibold">
                  Internal operations dashboard
                </h1>
              </div>
              <div className="flex flex-col gap-2 text-sm text-[#64748b] sm:flex-row sm:items-center">
                <span>
                  Signed in as{" "}
                  <span className="font-medium text-[#334155]">
                    {user.name}
                  </span>
                </span>
                <SignOutButton />
              </div>
            </div>
          </header>

          <main className="px-5 py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
