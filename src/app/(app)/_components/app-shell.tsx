import Link from "next/link";

import type { DemoUser } from "@/lib/auth/demo-account";

import { SignOutButton } from "./sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/orders", label: "Orders" },
  { href: "/inventory", label: "Inventory" },
  { href: "/issues", label: "Issues" },
  { href: "/reports", label: "Reports" },
];

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
            <div className="rounded-lg border border-[#d9e1ea] px-3 py-2 text-sm text-[#334155] lg:mt-6">
              Demo workspace
            </div>
          </div>

          <nav
            aria-label="Main navigation"
            className="mt-5 flex min-w-0 max-w-full gap-2 overflow-x-auto lg:block lg:space-y-1"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block min-w-fit rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#edf3f7] hover:text-[#0f172a]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
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
