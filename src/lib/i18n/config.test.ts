import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales } from "./config";

describe("i18n config", () => {
  it("supports exactly German and English", () => {
    expect(locales).toEqual(["de", "en"]);
  });

  it("defaults to German for the DACH market", () => {
    expect(defaultLocale).toBe("de");
  });

  it("isLocale accepts supported locales only", () => {
    expect(isLocale("de")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});
