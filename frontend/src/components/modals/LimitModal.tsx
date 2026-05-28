"use client";

import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";

import { Modal } from "./Modal";

// Modal shown when a user hits their trial cap.
// - Anonymous: encourage signup (more value behind the door)
// - Signed-in: friendly "come back tomorrow" — we're not selling yet
export function LimitModal({
  open,
  onClose,
  kind,
}: {
  open: boolean;
  onClose: () => void;
  kind: "anonymous" | "signed-in";
}) {
  // ANONYMOUS — push toward signup
  if (kind === "anonymous") {
    return (
      <Modal open={open} onClose={onClose} title="You've used your free trials">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
          <Sparkles className="h-7 w-7 text-blue-600" />
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          Sign up to keep going
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          You've used all 3 free trials. Create an account and get{" "}
          <span className="font-semibold text-slate-900">
            5 free analyses per day
          </span>
          . No credit card required.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href="/sign-up"
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Sign up — 5 analyses/day free
          </Link>
          <p className="text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Modal>
    );
  }

  // SIGNED-IN — friendly daily-cap message, no upsell
  return (
    <Modal open={open} onClose={onClose} title="Daily limit reached">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Clock className="h-7 w-7 text-slate-700" />
      </div>

      <h3 className="text-xl font-bold text-slate-900">
        You're all out for today
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        You've used all 5 free analyses today. Your limit resets at midnight
        UTC — come back tomorrow for 5 more.
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Have feedback on the product? We'd love to hear it.
      </p>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Got it
      </button>
    </Modal>
  );
}