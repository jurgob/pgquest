import rawSections from "./search-index.generated.json";
import { lessons, type LessonCatalogItem } from "./lesson-catalog";
import type { LessonId } from "./types";

export type SearchSection = {
  anchor: string | null;
  heading: string | null;
  lessonId: LessonId;
  text: string;
};

export type SearchSegment = {
  highlighted: boolean;
  text: string;
};

export type SearchSnippet = {
  anchor: string | null;
  heading: string | null;
  segments: SearchSegment[];
};

export type LessonSearchResult = {
  lesson: LessonCatalogItem;
  score: number;
  snippets: SearchSnippet[];
};

const sections = rawSections as SearchSection[];
const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

const snippetRadius = 60;
const maxSnippetsPerLesson = 3;
const minQueryLength = 2;

export function searchLessons(rawQuery: string): LessonSearchResult[] {
  const query = rawQuery.trim().toLowerCase();

  if (query.length < minQueryLength) {
    return [];
  }

  const matchesByLesson = new Map<
    LessonId,
    { count: number; section: SearchSection }[]
  >();

  for (const section of sections) {
    const haystack = `${section.heading ?? ""} ${section.text}`.toLowerCase();
    const count = countOccurrences(haystack, query);

    if (count === 0) {
      continue;
    }

    const existing = matchesByLesson.get(section.lessonId) ?? [];
    existing.push({ count, section });
    matchesByLesson.set(section.lessonId, existing);
  }

  const results: LessonSearchResult[] = [];

  for (const [lessonId, matches] of matchesByLesson) {
    const lesson = lessonById.get(lessonId);

    if (!lesson) {
      continue;
    }

    const titleBoost = lesson.title.toLowerCase().includes(query) ? 1000 : 0;
    const totalOccurrences = matches.reduce((sum, match) => sum + match.count, 0);
    const score = titleBoost + matches.length * 10 + totalOccurrences;

    const snippets = [...matches]
      .sort((a, b) => b.count - a.count)
      .slice(0, maxSnippetsPerLesson)
      .map((match) => buildSnippet(match.section, query));

    results.push({ lesson, score, snippets });
  }

  results.sort((a, b) => b.score - a.score);

  return results;
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = 0;

  for (;;) {
    const found = haystack.indexOf(needle, index);

    if (found === -1) {
      return count;
    }

    count += 1;
    index = found + needle.length;
  }
}

function buildSnippet(section: SearchSection, query: string): SearchSnippet {
  const content = section.heading ? `${section.heading}. ${section.text}` : section.text;
  const matchIndex = content.toLowerCase().indexOf(query);

  if (matchIndex === -1) {
    return {
      anchor: section.anchor,
      heading: section.heading,
      segments: [{ highlighted: false, text: content.slice(0, snippetRadius * 2) }],
    };
  }

  const start = Math.max(0, matchIndex - snippetRadius);
  const end = Math.min(content.length, matchIndex + query.length + snippetRadius);

  const prefix = (start > 0 ? "…" : "") + content.slice(start, matchIndex);
  const match = content.slice(matchIndex, matchIndex + query.length);
  const suffix =
    content.slice(matchIndex + query.length, end) + (end < content.length ? "…" : "");

  return {
    anchor: section.anchor,
    heading: section.heading,
    segments: [
      { highlighted: false, text: prefix },
      { highlighted: true, text: match },
      { highlighted: false, text: suffix },
    ].filter((segment) => segment.text.length > 0),
  };
}
