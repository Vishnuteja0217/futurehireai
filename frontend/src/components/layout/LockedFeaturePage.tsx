"use client";

import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import type { TileColor } from "./SidebarItem";

// Reusable "locked" page shown when a user tries to access a feature they
// can't use yet. Used by:
//   - anonymous users hitting signed-in-only features (sign up to unlock)
//   - free signed-in users hitting Pro features (upgrade to unlock)
//
// Visual identity matches the sidebar tile — the colored icon hero is the
// same shade as the sidebar item that led here. Creates a satisfying
// "you're in the right place" moment instead of a generic error page.

interface LockedFeaturePageProps {
  icon: LucideIcon;
  tileColor: TileColor;
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  secondaryText?: string;
  secondaryHref?: string;
}

// Matches the sidebar tile palette (light bg + saturated icon color)
// but at a larger scale here since the hero icon is the focal point.
const heroStyles: Record<TileColor, { bg: string; fg: string }> = {
  blue: { bg: "bg-blue-100", fg: "text-blue-600" },
  purple: { bg: "bg-violet-100", fg: "text-violet-600" },
  coral: { bg: "bg-orange-100", fg: "text-orange-600" },
  green: { bg: "bg-emerald-100", fg: "text-emerald-600" },
  pink: { bg: "bg-rose-100", fg: "text-rose-600" },
  amber: { bg: "bg-amber-100", fg: "text-amber-600" },
  slate: { bg: "bg-slate-100", fg: "text-slate-600" },
};

export function LockedFeaturePage({
  icon: Icon,
  tileColor,
  title,
  description,
  features,
  ctaText,
  ctaHref,
  secondaryText,
  secondaryHref,
}: LockedFeaturePageProps) {
  const hero = heroStyles[tileColor];

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm md:p-12">
        {/* Colored hero icon — matches the sidebar tile color */}
        <div
          className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${hero.bg} ${hero.fg}`}
        >
          <Icon className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 md:text-base md:leading-7">
          {description}
        </p>

        {/* Feature list with checkmarks */}
        <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2.5 text-left">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-slate-700"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA stack */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={ctaHref}
            className="inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md"
          >
            {ctaText}
          </Link>
          {secondaryText && secondaryHref && (
            <Link
              href={secondaryHref}
              className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
            >
              {secondaryText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}