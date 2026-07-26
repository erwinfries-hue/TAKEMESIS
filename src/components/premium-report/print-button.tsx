"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ml-auto rounded-full border border-brand-neutral-200 px-3 py-1 text-xs font-medium text-brand-navy-900 transition-colors hover:bg-brand-neutral-100"
    >
      {label}
    </button>
  );
}
