import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addToLocalHistory,
  clearLocalHistory,
  getLocalHistorySnapshot,
  readLocalHistory,
  removeFromLocalHistory,
  subscribeToLocalHistory,
} from "./local-history";

describe("local search history", () => {
  beforeEach(() => {
    // Goes through clearLocalHistory (not a raw localStorage.clear()) so the
    // module's cached snapshot for useSyncExternalStore stays in sync with
    // storage between tests too.
    clearLocalHistory();
  });

  it("returns an empty list when nothing has been recorded", () => {
    expect(readLocalHistory()).toEqual([]);
  });

  it("adds an entry and stores it with a timestamp", () => {
    addToLocalHistory({ question: "Hilft Kreatin beim Muskelaufbau?", href: "/search?q=x" });
    const history = readLocalHistory();
    expect(history).toHaveLength(1);
    expect(history[0].question).toBe("Hilft Kreatin beim Muskelaufbau?");
    expect(history[0].href).toBe("/search?q=x");
    expect(typeof history[0].askedAt).toBe("string");
  });

  it("moves a re-asked question (same href) to the front instead of duplicating it", () => {
    addToLocalHistory({ question: "Frage A", href: "/search?q=a" });
    addToLocalHistory({ question: "Frage B", href: "/search?q=b" });
    addToLocalHistory({ question: "Frage A", href: "/search?q=a" });
    const history = readLocalHistory();
    expect(history).toHaveLength(2);
    expect(history[0].href).toBe("/search?q=a");
  });

  it("caps the list at 8 entries, dropping the oldest", () => {
    for (let i = 0; i < 10; i++) {
      addToLocalHistory({ question: `Frage ${i}`, href: `/search?q=${i}` });
    }
    const history = readLocalHistory();
    expect(history).toHaveLength(8);
    expect(history[0].href).toBe("/search?q=9");
    expect(history.some((entry) => entry.href === "/search?q=0")).toBe(false);
  });

  it("removes a single entry by href", () => {
    addToLocalHistory({ question: "Frage A", href: "/search?q=a" });
    addToLocalHistory({ question: "Frage B", href: "/search?q=b" });
    removeFromLocalHistory("/search?q=a");
    const history = readLocalHistory();
    expect(history).toHaveLength(1);
    expect(history[0].href).toBe("/search?q=b");
  });

  it("clears the whole history", () => {
    addToLocalHistory({ question: "Frage A", href: "/search?q=a" });
    clearLocalHistory();
    expect(readLocalHistory()).toEqual([]);
  });

  describe("useSyncExternalStore plumbing", () => {
    it("getLocalHistorySnapshot reflects mutations", () => {
      expect(getLocalHistorySnapshot()).toEqual([]);
      addToLocalHistory({ question: "Frage A", href: "/search?q=a" });
      expect(getLocalHistorySnapshot()).toHaveLength(1);
    });

    it("returns the same array reference when nothing changed (required by useSyncExternalStore)", () => {
      addToLocalHistory({ question: "Frage A", href: "/search?q=a" });
      const first = getLocalHistorySnapshot();
      const second = getLocalHistorySnapshot();
      expect(first).toBe(second);
    });

    it("notifies subscribers on add/remove/clear", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToLocalHistory(listener);

      addToLocalHistory({ question: "Frage A", href: "/search?q=a" });
      expect(listener).toHaveBeenCalledTimes(1);

      removeFromLocalHistory("/search?q=a");
      expect(listener).toHaveBeenCalledTimes(2);

      addToLocalHistory({ question: "Frage B", href: "/search?q=b" });
      clearLocalHistory();
      expect(listener).toHaveBeenCalledTimes(4);

      unsubscribe();
      addToLocalHistory({ question: "Frage C", href: "/search?q=c" });
      expect(listener).toHaveBeenCalledTimes(4);
    });
  });
});
