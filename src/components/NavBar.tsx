"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/",      label: "Dashboard" },
  { href: "/goals", label: "Goals"     },
  { href: "/about", label: "About"     },
];

/**
 * Top navigation bar — shared across all pages via layout.tsx.
 * Uses usePathname to highlight the active route.
 */
export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-neutral-900/80">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-orange-500 hover:text-orange-600"
        >
          Starva
        </Link>

        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-400"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
