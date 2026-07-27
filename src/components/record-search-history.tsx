"use client";

import { useEffect } from "react";
import { addToLocalHistory } from "@/lib/search-history/local-history";

/** No visual output — records a completed search into device-local history on mount. */
export function RecordSearchHistory({ question, href }: { question: string; href: string }) {
  useEffect(() => {
    addToLocalHistory({ question, href });
  }, [question, href]);

  return null;
}
