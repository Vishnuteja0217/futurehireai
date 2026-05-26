"use client";

import { MessageSquare } from "lucide-react";

// Floating feedback button — sits in the bottom-right on every page.
// Clicking it opens the Google Form in a new tab so users can leave
// structured feedback. Replace the URL below if you ever move forms.
const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSexPNL1qI0ADErTIl8RV9iktgaJ2XVMoObsiwQRJ6EMqvfhFw/viewform";

export function FeedbackButton() {
 return (
<a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Send feedback"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 sm:bottom-6 sm:right-6"
    >
      <MessageSquare className="h-4 w-4" />
      <span className="hidden sm:inline">Feedback</span>
    </a>
  );
}