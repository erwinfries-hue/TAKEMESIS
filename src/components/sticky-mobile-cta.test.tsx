import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StickyMobileCta } from "./sticky-mobile-cta";

function setTargetBottom(bottom: number) {
  const target = document.getElementById("eigene-frage");
  if (!target) throw new Error("target not found");
  vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
    bottom,
    top: bottom - 100,
    left: 0,
    right: 0,
    width: 0,
    height: 100,
    x: 0,
    y: bottom - 100,
    toJSON: () => ({}),
  });
}

describe("StickyMobileCta", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("renders nothing before the target has been scrolled past", () => {
    document.body.innerHTML = '<div id="eigene-frage"></div>';
    setTargetBottom(400);
    render(<StickyMobileCta label="Los geht's" targetId="eigene-frage" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders once the target's bottom has scrolled above the viewport", async () => {
    document.body.innerHTML = '<div id="eigene-frage"></div>';
    setTargetBottom(400);
    render(<StickyMobileCta label="Los geht's" targetId="eigene-frage" />);

    setTargetBottom(-50);
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Los geht's" })).toBeInTheDocument();
    });
    expect(screen.getByRole("link")).toHaveAttribute("href", "#eigene-frage");
  });

  it("hides again once scrolled back so the target is on screen", async () => {
    document.body.innerHTML = '<div id="eigene-frage"></div>';
    setTargetBottom(-50);
    render(<StickyMobileCta label="Los geht's" targetId="eigene-frage" />);
    await waitFor(() => {
      expect(screen.getByRole("link")).toBeInTheDocument();
    });

    setTargetBottom(400);
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  it("renders nothing when the target id does not exist in the DOM", () => {
    document.body.innerHTML = "";
    render(<StickyMobileCta label="Los geht's" targetId="does-not-exist" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
