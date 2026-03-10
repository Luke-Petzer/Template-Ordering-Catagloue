"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { Route } from "next";

const NAV_LINKS: { href: Route; label: string }[] = [
  { href: "/dashboard", label: "Catalogue" },
  { href: "/orders", label: "Order History" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="h-[64px] border-b border-gray-100 bg-white flex items-center justify-between px-8 flex-shrink-0 z-50">
      {/* Left — brand + nav links */}
      <div className="flex items-center gap-8">
        <Link href={"/dashboard" as Route} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
            <Layers className="text-white w-[18px] h-[18px]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            SteelSource
          </span>
        </Link>

        <div className="flex items-center gap-8 ml-4">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "text-sm font-medium transition-colors relative",
                  isActive
                    ? "text-slate-900 after:absolute after:left-0 after:right-0 after:-bottom-[22px] after:h-[2px] after:bg-slate-900"
                    : "text-gray-400 hover:text-slate-900",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right — logout */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="text-xs font-semibold px-4 py-2 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </form>
    </nav>
  );
}
