import { describe, expect, it } from "vitest";
import { slugify, safeReturnPath } from "../src/lib/utils";

describe("slugify", () => {
  it("creates clean shareable slugs", () => expect(slugify("My New Poster!")).toBe("my-new-poster"));
  it("handles repeated spaces and punctuation", () => expect(slugify("  Digital___Art & Design ")).toBe("digital-art-design"));
});

describe("safeReturnPath", () => {
  it("allows internal paths", () => expect(safeReturnPath("/admin/posts")).toBe("/admin/posts"));
  it("rejects external and protocol-relative URLs", () => {
    expect(safeReturnPath("https://example.com")).toBe("/admin");
    expect(safeReturnPath("//evil.example")).toBe("/admin");
  });
});
