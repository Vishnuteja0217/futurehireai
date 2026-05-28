"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// One row in the sidebar with a colored icon tile.
// 4 visual states: default / active / locked / coming-soon.
//
// Each feature passes its own `tileColor` (a Tailwind color key like 'purple', 'coral')
// so we get per-feature visual identity. We map the color key to actual Tailwind
// classes via the tileStyles object below — Tailwind's JIT can't generate dynamic
// class names from variables, so the mapping must be explicit.

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  tileColor: TileColor;
  active?: boolean;
  locked?: boolean;
  comingSoon?: boolean;
}

type TileColor =
  | "blue"
  | "purple"
  | "coral"
  | "green"
  | "pink"
  | "amber"
  | "slate";

// Per-color Tailwind class pairs: { bg, fg }
// Light tile bg + bold icon fg for inactive items.
// Active state overrides these (see below).
const tileStyles: Record<TileColor, { bg: string; fg: string }> = {
  blue: { bg: "bg-blue-100", fg: "text-blue-700" },
  purple: { bg: "bg-violet-100", fg: "text-violet-700" },
  coral: { bg: "bg-orange-100", fg: "text-orange-600" },
  green: { bg: "bg-emerald-100", fg: "text-emerald-700" },
  pink: { bg: "bg-rose-100", fg: "text-rose-700" },
  amber: { bg: "bg-amber-100", fg: "text-amber-700" },
  slate: { bg: "bg-slate-100", fg: "text-slate-600" },
};

export function SidebarItem({
  href,
  icon: Icon,
  label,
  tileColor,
  active = false,
  locked = false,
  comingSoon = false,
}: SidebarItemProps) {
  const baseRow =
    "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors";

  const rowState = active
    ? "bg-blue-50 text-blue-700 font-medium"
    : locked || comingSoon
      ? "text-slate-400 hover:bg-slate-50"
      : "text-slate-700 hover:bg-slate-50";

  // The tile keeps its color in all states, but fades for locked/coming-soon.
  // Active state: tile gets a slightly bolder shadow ring for emphasis.
  const tile = tileStyles[tileColor];
  const tileBaseClasses =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md";
  const tileStateClasses = active
    ? `${tile.bg} ${tile.fg} ring-1 ring-inset ring-blue-200`
    : locked || comingSoon
      ? `${tile.bg} ${tile.fg} opacity-60`
      : `${tile.bg} ${tile.fg}`;

  return (
    <Link href={href} className={`${baseRow} ${rowState}`}>
      <div className={`${tileBaseClasses} ${tileStateClasses}`}>
        <Icon className="h-4 w-4" />
      </div>

      <span className="flex-1 truncate">{label}</span>

      {locked && (
        <Lock className="h-3 w-3 shrink-0 opacity-70" aria-label="Locked" />
      )}

      {comingSoon && !locked && (
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Soon
        </span>
      )}
    </Link>
  );
}

// Export the type so AppSidebar can use it for type-safe color props.
export type { TileColor };