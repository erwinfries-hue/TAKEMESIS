"use client";

import { useEffect, useState } from "react";

/**
 * Mobile-only (sm:hidden) — appears once the visitor scrolls past
 * `targetId` (the real question-input section), so it never covers
 * content that's already on screen, and disappears again if they scroll
 * back up to it.
 *
 * Uses a scroll listener rather than IntersectionObserver: the observer's
 * callback only fires on a boundary crossing (not-intersecting <->
 * intersecting), so a fast/flick scroll that skips past the target between
 * sampled frames without ever registering as "intersecting" never fires the
 * callback again and leaves the bar permanently hidden.
 */
export function StickyMobileCta({ label, targetId }: { label: string; targetId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }
    let ticking = false;
    const checkPosition = () => {
      ticking = false;
      setVisible(target.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(checkPosition);
      }
    };
    checkPosition();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-neutral-200 bg-white p-3 shadow-lg sm:hidden">
      <a
        href={`#${targetId}`}
        className="block w-full rounded-full bg-brand-navy-900 px-6 py-3 text-center text-sm font-medium text-white"
      >
        {label}
      </a>
    </div>
  );
}
