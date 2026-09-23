import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseHTML } from "linkedom";
import { MemoryRouter } from "react-router";
import { ExerciseProgressProvider } from "../app/sql/exercise-progress-context";
import { lessons } from "../app/sql/lesson-catalog";

// Skip tags whose text is code, decoration, or interactive chrome rather than
// prose: SQL code blocks (<pre>), diagrams (<svg>), and exercise buttons.
const skipTags = new Set(["pre", "svg", "button", "script", "style"]);

type Section = {
  anchor: string | null;
  heading: string | null;
  lessonId: string;
  text: string;
};

const root = process.cwd();
const outPath = path.join(root, "app", "generated", "search-index.json");
const sections: Section[] = [];

for (const lesson of lessons) {
  const modulePath = path.join(root, "app", lesson.routeModule);
  const mod: { default: React.ComponentType } = await import(
    pathToFileURL(modulePath).href
  );
  const Component = mod.default;

  let html: string;

  try {
    html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: [lesson.href] },
        React.createElement(
          ExerciseProgressProvider,
          null,
          React.createElement(Component),
        ),
      ),
    );
  } catch (error) {
    console.warn(
      `Skipping ${lesson.slug}: failed to render (${(error as Error).message})`,
    );
    sections.push({
      anchor: null,
      heading: null,
      lessonId: lesson.id,
      text: lesson.summary,
    });
    continue;
  }

  const { document } = parseHTML(html);
  const article = document.querySelector("article");

  if (!article) {
    sections.push({
      anchor: null,
      heading: null,
      lessonId: lesson.id,
      text: lesson.summary,
    });
    continue;
  }

  sections.push(...extractSections(article, lesson.id));
}

fs.writeFileSync(outPath, `${JSON.stringify(sections, null, 2)}\n`);
console.log(
  `Wrote ${sections.length} sections for ${lessons.length} lessons to ${outPath}`,
);

function extractSections(article: Element, lessonId: string): Section[] {
  const result: Section[] = [{ anchor: null, heading: null, lessonId, text: "" }];

  walk(article);

  return result
    .map((section) => ({ ...section, text: normalizeWhitespace(section.text) }))
    .filter((section) => section.text.length > 0);

  function walk(node: Element) {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3 /* TEXT_NODE */) {
        appendText(child.textContent ?? "");
        continue;
      }

      if (child.nodeType !== 1 /* ELEMENT_NODE */) {
        continue;
      }

      const element = child as Element;
      const tag = element.tagName.toLowerCase();

      if (skipTags.has(tag)) {
        continue;
      }

      if (tag === "h2" && element.getAttribute("id")) {
        result.push({
          anchor: element.getAttribute("id"),
          heading: normalizeWhitespace(element.textContent ?? ""),
          lessonId,
          text: "",
        });
        continue;
      }

      appendText(" ");
      walk(element);
      appendText(" ");
    }
  }

  function appendText(text: string) {
    const current = result[result.length - 1];

    if (current) {
      current.text += text;
    }
  }
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
