"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { ClipboardList, Bookmark, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/mock-test", icon: ClipboardList, label: "Mock Test" },
  { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
] as const;

export function NavHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-1 shrink-0 font-bold hover:opacity-80 transition-opacity"
        >
          GUJCET{" "}
          <span className="font-normal text-muted-foreground text-sm">PYQ</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-0.5">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1.5", pathname === href && "bg-muted font-semibold")}
              >
                <Icon data-icon="inline-start" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {/* Mobile icon-only nav */}
          <div className="flex sm:hidden">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                  className={cn(pathname === href && "bg-muted")}
                >
                  <Icon />
                </Button>
              </Link>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
