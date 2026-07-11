"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", mark: "01" },
  { href: "/customers", label: "Customers", mark: "02" },
  { href: "/orders", label: "Orders", mark: "03" },
  { href: "/inventory", label: "Inventory", mark: "04" },
  { href: "/issues", label: "Issues", mark: "05" },
  { href: "/reports", label: "Reports", mark: "06" },
];

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="op-main-navigation mt-6 grid min-w-0 max-w-full grid-cols-3 gap-2 lg:mt-8 lg:block lg:space-y-1"
    >
      {navItems.map((item) => {
        const isActive = isActiveRoute(pathname, item.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className="op-nav-link op-focus-ring flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-semibold sm:text-sm lg:justify-start lg:gap-3 lg:px-3"
            data-active={isActive ? "true" : "false"}
            href={item.href}
            key={item.href}
          >
            <span aria-hidden="true" className="op-nav-mark">{item.mark}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
