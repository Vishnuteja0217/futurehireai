"use client";

import {
  ChartBar,
  Clock,
  ClipboardList,
  Mail,
  Mic,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { SidebarItem } from "./SidebarItem";

// Sidebar shown to all users on /app/*.
// The brand lives in the top header now (Pattern B), so this component
// is pure nav + footer. Cleaner this way — sidebar = navigation, header = chrome.

interface AppSidebarProps {
  activePath?: string;
  isSignedIn?: boolean;
  usageCurrent?: number;
  usageLimit?: number;
  tier?: "anonymous" | "free" | "pro" | "premium";
}

export function AppSidebar({
  activePath = "/app",
  isSignedIn = false,
  usageCurrent = 0,
  usageLimit = 3,
  tier = "anonymous",
}: AppSidebarProps) {
  const lockedForAnon = !isSignedIn;

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4">
      {/* Core features */}
      <nav className="flex flex-col gap-0.5">
        <SidebarItem
          href="/app"
          icon={ChartBar}
          label="Analyze"
          tileColor="blue"
          active={activePath === "/app"}
        />
        <SidebarItem
          href="/app/candidate-evaluation"
          icon={Sparkles}
          label="Candidate Evaluation"
          tileColor="purple"
          active={activePath === "/app/candidate-evaluation"}
          locked={lockedForAnon}
        />
        <SidebarItem
          href="/app/cover-letter"
          icon={Mail}
          label="Cover Letter"
          tileColor="coral"
          active={activePath === "/app/cover-letter"}
          locked={lockedForAnon}
        />
        <SidebarItem
          href="/app/mock-interview"
          icon={Mic}
          label="Mock Interview"
          tileColor="green"
          active={activePath === "/app/mock-interview"}
          locked={lockedForAnon}
        />
        <SidebarItem
          href="/app/guidance"
          icon={Users}
          label="1-on-1 Guidance"
          tileColor="pink"
          active={activePath === "/app/guidance"}
          locked={lockedForAnon}
        />
      </nav>

      <div className="my-4 h-px bg-slate-100" />

      <nav className="flex flex-col gap-0.5">
        <SidebarItem
          href="/app/tracker"
          icon={ClipboardList}
          label="Tracker"
          tileColor="amber"
          active={activePath === "/app/tracker"}
          locked={lockedForAnon}
          comingSoon={!lockedForAnon}
        />
        <SidebarItem
          href="/app/history"
          icon={Clock}
          label="History"
          tileColor="slate"
          active={activePath === "/app/history"}
          locked={lockedForAnon}
          comingSoon={!lockedForAnon}
        />
      </nav>

      <div className="flex-1" />

      <UsageFooter
        isSignedIn={isSignedIn}
        usageCurrent={usageCurrent}
        usageLimit={usageLimit}
        tier={tier}
      />
    </aside>
  );
}

function UsageFooter({
  isSignedIn,
  usageCurrent,
  usageLimit,
  tier,
}: {
  isSignedIn: boolean;
  usageCurrent: number;
  usageLimit: number;
  tier: AppSidebarProps["tier"];
}) {
  if (!isSignedIn) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-semibold text-blue-900">
          {usageLimit - usageCurrent} of {usageLimit} free trials left
        </p>
        <p className="mt-1 text-[11px] leading-snug text-blue-700">
          Sign up free for 5 more per month + all features.
        </p>
        <Link
          href="/sign-up"
          className="mt-2 block w-full rounded-md bg-blue-600 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Sign up free
        </Link>
      </div>
    );
  }

  if (tier === "pro" || tier === "premium") {
    return (
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold capitalize text-slate-700">
          {tier} plan
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {usageCurrent} / {usageLimit} this month
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{
              width: `${Math.min(100, (usageCurrent / usageLimit) * 100)}%`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-700">Free plan</p>
      <p className="mt-1 text-[11px] text-slate-500">
        {usageCurrent} / {usageLimit} this month
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{
            width: `${Math.min(100, (usageCurrent / usageLimit) * 100)}%`,
          }}
        />
      </div>
      <Link
        href="/pricing"
        className="mt-3 block w-full rounded-md border border-blue-200 bg-white px-3 py-1.5 text-center text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
      >
        ⭐ Upgrade plan
      </Link>
    </div>
  );
}