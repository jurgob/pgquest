import type { ReactNode } from "react";

// A deliberately small Markdown subset for rendering CHANGELOG.md: headings
// (#, ##, ###), "- " bullet lists (indented lines continue the previous item),
// paragraphs, and inline `code`, **bold**, and [links](url). Anything else is
// shown as plain text rather than pulling in a full Markdown dependency.

export type MarkdownBlock =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string };

export type MarkdownInline =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "link"; text: string; href: string };

const headingPattern = /^(#{1,3})\s+(.*)$/;
const listItemPattern = /^[-*]\s+(.*)$/;

export function parseMarkdownBlocks(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] | undefined;

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
    if (list) {
      blocks.push({ kind: "list", items: list });
      list = undefined;
    }
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flush();
      continue;
    }

    const heading = headingPattern.exec(line);
    if (heading?.[1] && heading[2] !== undefined) {
      flush();
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2],
      });
      continue;
    }

    const listItem = listItemPattern.exec(line);
    if (listItem?.[1] !== undefined) {
      if (paragraph.length > 0) {
        flush();
      }
      list ??= [];
      list.push(listItem[1]);
      continue;
    }

    const lastIndex = list ? list.length - 1 : -1;
    if (list && lastIndex >= 0 && /^\s/.test(rawLine)) {
      list[lastIndex] = `${list[lastIndex]} ${line}`;
      continue;
    }

    if (list) {
      flush();
    }
    paragraph.push(line);
  }

  flush();
  return blocks;
}

const inlinePattern = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseMarkdownInline(text: string): MarkdownInline[] {
  const parts: MarkdownInline[] = [];
  let cursor = 0;

  for (const match of text.matchAll(inlinePattern)) {
    if (match.index > cursor) {
      parts.push({ kind: "text", text: text.slice(cursor, match.index) });
    }

    const [whole, code, strong, linkText, href] = match;
    if (code !== undefined) {
      parts.push({ kind: "code", text: code });
    } else if (strong !== undefined) {
      parts.push({ kind: "strong", text: strong });
    } else if (linkText !== undefined && href !== undefined) {
      parts.push({ kind: "link", text: linkText, href });
    }

    cursor = match.index + whole.length;
  }

  if (cursor < text.length) {
    parts.push({ kind: "text", text: text.slice(cursor) });
  }

  return parts;
}

const linkClass =
  "text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900";

export function MarkdownInlineText({ text }: { text: string }): ReactNode {
  return parseMarkdownInline(text).map((part, index) => {
    switch (part.kind) {
      case "text":
        return part.text;
      case "code":
        return (
          <code
            className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.9em]"
            key={index}
          >
            {part.text}
          </code>
        );
      case "strong":
        return <strong key={index}>{part.text}</strong>;
      case "link": {
        const external = /^https?:\/\//.test(part.href);
        return (
          <a
            className={linkClass}
            href={part.href}
            key={index}
            {...(external ? { rel: "noreferrer", target: "_blank" } : {})}
          >
            {part.text}
          </a>
        );
      }
    }
  });
}
