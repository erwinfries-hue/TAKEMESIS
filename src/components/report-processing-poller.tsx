"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 5000;

/**
 * Re-fetches the (server-rendered) report page on an interval while report
 * generation is still running, so the "wird erstellt" status flips to the
 * finished report on its own — no manual reload needed. Live-reported gap
 * (2026-08-01): visitors were landing on this page and had to actively
 * refresh themselves to see the result.
 */
export function ReportProcessingPoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
