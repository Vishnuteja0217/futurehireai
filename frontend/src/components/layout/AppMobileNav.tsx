"use client";

import {
  ChartBar,
  ClipboardList,
  Clock,
  FileText,
  Lock,
  Mail,
  Menu,
  Mic,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mobile bottom navigation bar (< 768px viewport).
// Shows 4 most-used features + "More" sheet for the remaining 3.
// Plain icons (Instagram-style) for native phone-app feel.
//
// The "More" sheet is a bottom slide-up drawer that lists the overflow
// items. Tapping outside or the X button closes it.

interface AppMobileNavProps {
  activePath?: string;
  isSignedIn?: boolean;
}

// The 4 items pinned to the bar — most-used features.
const BAR_ITEMS: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  requiresAuth: boolean;
}> = [
  { href: "/app", icon: ChartBar, label: "Analyze", requiresAuth: false },
  { href: "/app/tailored-resume", icon: FileText, label: "Resume", requiresAuth: true },
  { href: "/app/cover-letter", icon: Mail, label: "Cover", requiresAuth: true },
  { href: "/app/mock-interview", icon: Mic, label: "Mock", requiresAuth: true },
];

// Overflow items that live behind "More".
const MORE_ITEMS: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  requiresAuth: boolean;
  comingSoon?: boolean;
}> = [
  { href: "/app/guidance", icon: Users, label: "1-on-1 Guidance", requiresAuth: true },
  { href: "/app/tracker", icon: ClipboardList, label: "Tracker", requiresAuth: true, comingSoon: true },
  { href: "/app/history", icon: Clock, label: "History", requiresAuth: true, comingSoon: true },
];

export function AppMobileNav({
  activePath = "/app",
  isSignedIn = false,
}: AppMobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Fixed bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 md:hidden">
        {BAR_ITEMS.map((item) => {
          const active = activePath === item.href;
          const locked = item.requiresAuth && !isSignedIn;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1"
            >
              <Icon
                className={`h-5 w-5 ${active ? "text-blue-600" : "text-slate-500"}`}
              />
              <span
                className={`text-[10px] font-medium ${active ? "text-blue-600" : "text-slate-500"}`}
              >
                {item.label}
              </span>
              {locked && (
                <Lock className="absolute right-3 top-1 h-2.5 w-2.5 text-slate-400" />
              )}
            </Link>
          );
        })}

        {/* "More" trigger */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1"
        >
          <Menu className={`h-5 w-5 ${moreOpen ? "text-blue-600" : "text-slate-500"}`} />
          <span className={`text-[10px] font-medium ${moreOpen ? "text-blue-600" : "text-slate-500"}`}>
            More
          </span>
        </button>
      </nav>

      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div className="h-16 md:hidden" />

      {/* "More" sheet — backdrop + bottom drawer */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-lg md:hidden">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {MORE_ITEMS.map((item) => {
                const active = activePath === item.href;
                const locked = item.requiresAuth && !isSignedIn;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${
                      active
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {locked && <Lock className="h-3 w-3 shrink-0 text-slate-400" />}
                    {item.comingSoon && !locked && (
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}