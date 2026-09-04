import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { badge: "h-10 w-10", glow: "h-14 w-14", icon: "h-4 w-4", highlight: "left-[20%] top-[16%] h-[30%] w-[36%]" },
  md: { badge: "h-14 w-14", glow: "h-20 w-20", icon: "h-6 w-6", highlight: "left-[18%] top-[14%] h-[32%] w-[38%]" },
  lg: { badge: "h-16 w-16", glow: "h-24 w-24", icon: "h-7 w-7", highlight: "left-[18%] top-[13%] h-[32%] w-[38%]" },
} as const;

/**
 * A frosted-glass, faintly 3D icon badge used wherever a category needs a
 * visual stand-in for missing product photography. Same glass treatment for
 * every category (keeps it feeling like one considered system, not a pile of
 * colored icon tiles) — only the ambient glow behind the disc, via `glow`
 * (a per-category Tailwind class from category-visuals.ts), shifts with the
 * category's brand tone. Three layers create the depth: a blurred color glow
 * grounding the disc, the disc itself (translucent + backdrop-blur + an
 * inset light/shadow pair for a convex feel), and a small blurred highlight
 * standing in for a light reflection.
 */
export function CategoryIcon({
  icon: Icon,
  glow,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  glow: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];

  return (
    <div className={cn("relative flex shrink-0 items-center justify-center", className)}>
      <span aria-hidden="true" className={cn("absolute rounded-full blur-xl", s.glow, glow)} />
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full border border-white/50 bg-white/25 backdrop-blur-md dark:border-white/15 dark:bg-white/10",
          "shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.7),inset_0_-8px_14px_-9px_rgba(0,0,0,0.3),0_10px_20px_-10px_rgba(0,0,0,0.4)]",
          s.badge,
        )}
      >
        <span
          aria-hidden="true"
          className={cn("absolute rounded-full bg-white/70 blur-[5px] dark:bg-white/25", s.highlight)}
        />
        <Icon
          className={cn("relative text-foreground/75 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]", s.icon)}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
