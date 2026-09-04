import { Cpu, ChefHat, Shirt, Dumbbell, Wrench, PackageSearch, type LucideIcon } from "lucide-react";

/**
 * No product photography exists for sample lots, so each category gets a
 * consistent icon + brand-toned treatment instead of a stock photo or a
 * blank placeholder — used as the card header on the feed and detail pages.
 * `gradient` washes the banner background; `glow` tints the frosted-glass
 * icon badge's ambient light (see <CategoryIcon>). Both are literal Tailwind
 * class fragments (not built from a variable) so Tailwind's scanner picks
 * them up at build time.
 */
interface CategoryVisual {
  icon: LucideIcon;
  gradient: string;
  glow: string;
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  Elektronik: {
    icon: Cpu,
    gradient: "from-primary/25 via-primary/10 to-transparent",
    glow: "bg-primary/35",
  },
  "Haushalt & Küche": {
    icon: ChefHat,
    gradient: "from-success/25 via-success/10 to-transparent",
    glow: "bg-success/35",
  },
  "Fashion & Bekleidung": {
    icon: Shirt,
    gradient: "from-brand-gold/35 via-brand-gold/10 to-transparent",
    glow: "bg-brand-gold/40",
  },
  "Sport & Freizeit": {
    icon: Dumbbell,
    gradient: "from-chart-4/25 via-chart-4/10 to-transparent",
    glow: "bg-chart-4/35",
  },
  "Bau & Werkzeug": {
    icon: Wrench,
    gradient: "from-chart-5/25 via-chart-5/10 to-transparent",
    glow: "bg-chart-5/35",
  },
};

const FALLBACK: CategoryVisual = {
  icon: PackageSearch,
  gradient: "from-primary/20 via-primary/5 to-transparent",
  glow: "bg-primary/30",
};

export function getCategoryVisual(category: string): CategoryVisual {
  return CATEGORY_VISUALS[category] ?? FALLBACK;
}

export function listKnownCategories(): string[] {
  return Object.keys(CATEGORY_VISUALS);
}
