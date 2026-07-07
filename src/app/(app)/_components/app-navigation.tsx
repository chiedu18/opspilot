"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/orders", label: "Orders" },
  { href: "/inventory", label: "Inventory" },
  { href: "/issues", label: "Issues" },
  { href: "/reports", label: "Reports" },
];

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="mt-5 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-x-visible lg:pb-0"
    >
      {navItems.map((item) => {
        const isActive = isActiveRoute(pathname, item.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`block min-w-fit rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#99f6e4] lg:min-w-0 ${
              isActive
                ? "border-[#99f6e4] bg-[#ecfdf5] text-[#0f766e]"
                : "border-transparent text-[#334155] hover:bg-[#edf3f7] hover:text-[#0f172a]"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
