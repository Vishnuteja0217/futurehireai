"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef } from "react";

// Reusable resume upload control.
// Two visual states:
//   - Empty: dashed dropzone with upload icon ("Drop your resume or browse")
//   - Filled: chip showing the file name with a clear (X) button
//
// File selection only — parsing happens server-side via uploadResume().
// Accepts the file via onChange so parent owns the state.
// Used by /app/cover-letter and (eventually) /app/tailored-resume.

interface ResumeUploaderProps {
  file: File | null;
  onChange: (f: File | null) => void;
  // Optional label shown above the control. Defaults to none for flexibility.
  label?: string;
  // Optional helper text shown next to the "change" link when a file is loaded.
  helper?: string;
}

export function ResumeUploader({
  file,
  onChange,
  label,
  helper,
}: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerBrowse = () => inputRef.current?.click();

  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {file && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
            >
              Clear &amp; upload new
            </button>
          )}
        </div>
      )}

      {/* Hidden native input — driven by the visual control */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {file ? (
        // Filled state — file chip
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {file.name}
            </p>
            {helper && (
              <p className="truncate text-xs text-slate-500">{helper}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Empty state — dashed dropzone
        <button
          type="button"
          onClick={triggerBrowse}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 transition hover:border-blue-300 hover:bg-blue-50/30"
        >
          <Upload className="h-6 w-6 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            Drop your resume here or click to browse
          </span>
          <span className="text-xs text-slate-500">PDF or DOCX</span>
        </button>
      )}
    </div>
  );
}