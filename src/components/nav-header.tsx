"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Home, ClipboardList, Bookmark, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, UserButton } from "@clerk/nextjs";

const desktopNavItems = [
  { href: "/mock-test", icon: ClipboardList, label: "Mock Test" },
  { href: "/bookmarks", icon: Bookmark, label: "Saved" },
  { href: "/analytics", icon: BarChart3, label: "Progress" },
] as const;

const mobileNavItems = [
  { href: "/", icon: Home, label: "Home", exact: true },
  ...desktopNavItems.map((item) => ({ ...item, exact: false })),
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function NavHeader() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY.current) < 10) return;
      setHidden(y > lastY.current && y > 56);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide nav on auth pages
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return null;
  }

  // Home tab is active when no other tab matches
  const isOnHomeSection = !desktopNavItems.some((item) =>
    isActive(pathname, item.href)
  );

  return (
    <>
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Top header */}
      <header className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300",
        hidden && "-translate-y-full"
      )}>
        <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
          <div className="flex flex-1 items-center">
            <Link
              href="/"
              className="flex items-center shrink-0 rounded-sm transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="text-[15px] font-bold leading-none tracking-wide">GUJCET</span>
              <span
                className="mx-1.5 flex h-3.5 w-[3px] flex-col overflow-hidden rounded-full"
                aria-hidden="true"
              >
                <span className="flex-1 bg-blue-500" />
                <span className="flex-1 bg-green-500" />
                <span className="flex-1 bg-purple-500" />
              </span>
              <span className="text-xs font-medium leading-none text-muted-foreground">
                PYQ
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1" aria-label="Main navigation">
            {desktopNavItems.map(({ href, icon: Icon, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 h-9 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && "bg-muted font-semibold"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2">
            <ThemeToggle />
            {/* Auth */}
            {isLoaded && (
              isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "size-8",
                      userButtonPopoverCard: "border border-border shadow-md",
                      userButtonPopoverActionButton: "hover:bg-muted",
                    },
                  }}
                />
              ) : (
                <Link
                  href="/sign-in"
                  className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Sign in
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)] sm:hidden transition-transform duration-300",
          hidden && "translate-y-full"
        )}
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {mobileNavItems.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? isOnHomeSection : isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0",
                    active && "text-primary"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] leading-tight",
                    active ? "font-semibold" : "font-medium"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
