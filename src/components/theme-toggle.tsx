"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Toggles the `.dark` class on <html> and remembers the choice in
 * localStorage. The initial class is set synchronously before paint by the
 * inline script in <ThemeInitScript> (see theme-init.tsx) so there's no
 * flash of the wrong theme — this component only reads that already-applied
 * state on mount and flips it on click.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Reading the DOM's already-applied class (set synchronously pre-hydration
    // by <ThemeInitScript>) is the whole point here — it can't be known during
    // SSR, so this one-time post-mount read-and-set is correct, not a
    // synchronization smell the lint rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* localStorage unavailable (private mode etc.) — theme just won't persist. */
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Zu hellem Design wechseln" : "Zu dunklem Design wechseln"}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
    >
      {isDark === null ? (
        <span className="h-4 w-4" />
      ) : isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
