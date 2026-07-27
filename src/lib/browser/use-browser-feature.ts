"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * SSR-safe feature detection: `false` on the server and on the very first
 * client render (matching what was server-rendered, so no hydration
 * mismatch), then the real client-side result once React reads the client
 * snapshot post-hydration. Avoids the classic `useState` + `useEffect`
 * setState-in-effect pattern for something that's a pure, one-time
 * environment read rather than genuinely reactive state.
 */
export function useBrowserFeatureSupported(check: () => boolean): boolean {
  return useSyncExternalStore(noopSubscribe, check, () => false);
}
