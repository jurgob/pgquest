import { describe, expect, it } from "vitest";

import { parseMarkdownBlocks, parseMarkdownInline } from "./markdown";

describe("parseMarkdownBlocks", () => {
  it("splits headings, paragraphs, and lists with continuation lines", () => {
    const source = [
      "# Changelog",
      "",
      "Notable changes,",
      "newest first.",
      "",
      "## 2026-09-27",
      "",
      "- First item",
      "  continues here.",
      "- Second item",
      "After the list.",
    ].join("\n");

    expect(parseMarkdownBlocks(source)).toEqual([
      { kind: "heading", level: 1, text: "Changelog" },
      { kind: "paragraph", text: "Notable changes, newest first." },
      { kind: "heading", level: 2, text: "2026-09-27" },
      { kind: "list", items: ["First item continues here.", "Second item"] },
      { kind: "paragraph", text: "After the list." },
    ]);
  });
});

describe("parseMarkdownInline", () => {
  it("extracts code, bold, and links between plain text", () => {
    expect(
      parseMarkdownInline("See `/changelog`, **new**, and [docs](https://x.dev)."),
    ).toEqual([
      { kind: "text", text: "See " },
      { kind: "code", text: "/changelog" },
      { kind: "text", text: ", " },
      { kind: "strong", text: "new" },
      { kind: "text", text: ", and " },
      { kind: "link", text: "docs", href: "https://x.dev" },
      { kind: "text", text: "." },
    ]);
  });
});
