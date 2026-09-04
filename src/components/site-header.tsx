"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Boxes } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/listings", label: "Marktplatz" },
  { href: "/sell/new", label: "Verkaufen" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Set from the scroll listener's async callback, not synchronously in the
    // effect body — a subscription reacting to an external (scroll) change,
    // same pattern as <Reveal>'s IntersectionObserver. Starts from `false`,
    // which is correct for the overwhelming majority of page loads (top of
    // page); a restored mid-page scroll position just skips one frame of the
    // shadow, which is not worth a sync read-on-mount here.
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/85 backdrop-blur transition-shadow duration-200 supports-backdrop-blur:bg-background/70",
        scrolled ? "border-border shadow-sm" : "border-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="h-5 w-5" aria-hidden="true" />
          </span>
          Restposten
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-foreground/75 transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <Link href="/sell/new" className={buttonVariants({ variant: "default", size: "sm" })}>
            Kostenlos anmelden
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={mobileOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-t border-border transition-[grid-template-rows] duration-200 ease-out sm:hidden",
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-t-0",
        )}
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-6 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/sell/new"
              onClick={() => setMobileOpen(false)}
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-1")}
            >
              Kostenlos anmelden
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
