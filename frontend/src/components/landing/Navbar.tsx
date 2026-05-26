"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

// Smooth-scrolls to a section by id when clicked.
// Each landing section below has a matching id="..."
const navItems = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Roadmap", href: "#roadmap" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            FutureHire<span className="text-blue-600">AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </div>

        <a
          href="#upload"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30"
        >
          Try Beta Free
        </a>
      </div>
    </nav>
  );
}
