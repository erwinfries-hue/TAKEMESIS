import { describe, expect, it } from "vitest";
import { parseDoiInput } from "./study-lookup";

describe("parseDoiInput", () => {
  it("accepts a bare DOI", () => {
    expect(parseDoiInput("10.1000/182")).toBe("10.1000/182");
  });

  it("strips a doi.org URL prefix", () => {
    expect(parseDoiInput("https://doi.org/10.1000/182")).toBe("10.1000/182");
    expect(parseDoiInput("http://dx.doi.org/10.1000/182")).toBe("10.1000/182");
  });

  it("strips a 'doi:' prefix", () => {
    expect(parseDoiInput("doi:10.1000/182")).toBe("10.1000/182");
    expect(parseDoiInput("DOI: 10.1000/182")).toBe("10.1000/182");
  });

  it("trims surrounding whitespace and trailing punctuation from copy-pasted text", () => {
    expect(parseDoiInput("  10.1000/182.  ")).toBe("10.1000/182");
    expect(parseDoiInput("10.1000/182,")).toBe("10.1000/182");
  });

  it("returns null for empty input", () => {
    expect(parseDoiInput("")).toBeNull();
    expect(parseDoiInput("   ")).toBeNull();
  });

  it("returns null for text that isn't DOI-shaped", () => {
    expect(parseDoiInput("Does creatine help with muscle growth?")).toBeNull();
    expect(parseDoiInput("not-a-doi")).toBeNull();
    expect(parseDoiInput("PMID:12345678")).toBeNull();
  });
});
