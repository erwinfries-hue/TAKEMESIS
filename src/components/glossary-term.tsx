"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Click/tap-to-toggle definition popover — not hover-only, so it works the
 * same on touch devices as on desktop. Closes on outside click or Escape.
 */
export function GlossaryTerm({
  definition,
  children,
  triggerClassName,
}: {
  definition: string;
  children: React.ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        className={`inline-flex items-center gap-0.5 rounded focus:outline-none focus:ring-2 focus:ring-brand-teal-400 ${triggerClassName ?? ""}`}
      >
        {children}
        <span aria-hidden="true" className="text-[0.7em] leading-none opacity-70">
          ⓘ
        </span>
      </button>
      {open && (
        <span
          id={popoverId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-64 max-w-[80vw] rounded-lg border border-brand-neutral-200 bg-white p-3 text-left text-xs font-normal normal-case leading-relaxed text-brand-neutral-600 shadow-lg"
        >
          {definition}
        </span>
      )}
    </span>
  );
}
