import {
  databaseInit,
  examples,
  exercises,
  indexedDatabaseInit,
  migration,
  searchColumn,
  seed,
} from "../../cli_examples/full-text-search.sql";
import {
  getSqlExample,
  SQL_EXAMPLE_IDS,
  type SqlExampleId,
} from "../../cli_examples/types";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import {
  InlineCode,
  LessonLink,
  LessonSection,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
} from "../sql/lesson-layout";
import { SqlCodeViewer } from "../sql/sql-editor";

function Example({ id }: { id: SqlExampleId }) {
  return <ExampleBlock example={getSqlExample(examples, id)} />;
}

export default function FullTextSearch() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="full-text-search"
      whatWeLearned={[
        {
          concept: "tsvector",
          url: "https://www.postgresql.org/docs/current/datatype-textsearch.html",
          description: "a document as a sorted list of normalized words (lexemes).",
        },
        {
          concept: "tsquery",
          url: "https://www.postgresql.org/docs/current/textsearch-controls.html",
          description: (
            <>
              the search, built with <InlineCode>plainto_tsquery</InlineCode> or{" "}
              <InlineCode>websearch_to_tsquery</InlineCode>, matched with{" "}
              <InlineCode>@@</InlineCode>.
            </>
          ),
        },
        {
          concept: "ts_rank",
          url: "https://www.postgresql.org/docs/current/textsearch-controls.html#TEXTSEARCH-RANKING",
          description: "scores matches; setweight makes title words count more.",
        },
        {
          concept: "ts_headline",
          description: "highlights the matching words in a snippet.",
        },
        {
          concept: "GIN index",
          url: "https://www.postgresql.org/docs/current/textsearch-indexes.html",
          description: "an inverted index from each lexeme to the rows that contain it.",
        },
      ]}
    >
      <Paragraphs>
        <p>
          <LessonLink to="/lessons/text-search-basics">LIKE and ILIKE</LessonLink> match
          characters: <InlineCode>&apos;%indexing%&apos;</InlineCode> never finds
          &quot;Indexes&quot;. Full-text search matches words. It reduces text to lexemes,
          so &quot;indexing&quot;, &quot;indexes&quot; and &quot;index&quot; are the same
          word, understands search-box syntax, ranks the results, and has an index. It is
          built into PostgreSQL: no extension needed.
        </p>
        <p className="mt-3">
          Same eight documents as the{" "}
          <LessonLink to="/lessons/vectors">vectors lesson</LessonLink>, without the
          embeddings.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="the-documents">The documents</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={migration} />
        </div>
        <div className="mt-4">
          <SqlCodeViewer code={seed} databaseInitId={databaseInit.id} />
        </div>
      </Section>

      <Example id={SQL_EXAMPLE_IDS.fullTextSearchLexemes} />
      <Example id={SQL_EXAMPLE_IDS.fullTextSearchMatch} />
      <Example id={SQL_EXAMPLE_IDS.fullTextSearchWebsearch} />
      <Example id={SQL_EXAMPLE_IDS.fullTextSearchRank} />
      <Example id={SQL_EXAMPLE_IDS.fullTextSearchHeadline} />

      <LessonSection>
        <Title2 id="a-search-column">A search column and an index</Title2>
        <Paragraph>
          The examples above call <InlineCode>to_tsvector</InlineCode> on every row, for
          every search. In a real table, store the tsvector in a generated column, and
          index it:
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={searchColumn} databaseInitId={indexedDatabaseInit.id} />
        </div>
      </LessonSection>

      <Example id={SQL_EXAMPLE_IDS.fullTextSearchIndexScan} />
      <Example id={SQL_EXAMPLE_IDS.fullTextSearchTypo} />

      <LessonSection>
        <Title2 id="limits">Limits</Title2>
        <Paragraph>
          Full-text search knows words and their forms, nothing more. It doesn&apos;t
          forgive typos: <LessonLink to="/lessons/fuzzy-search">fuzzy search</LessonLink>{" "}
          does. It doesn&apos;t know that &quot;speed up&quot; and &quot;faster&quot; mean
          the same thing: <LessonLink to="/lessons/vectors">vector search</LessonLink>{" "}
          does. The language matters too: <InlineCode>&apos;english&apos;</InlineCode>{" "}
          stems English words; Postgres ships configurations for about 30 languages, and{" "}
          <InlineCode>&apos;simple&apos;</InlineCode> for no stemming at all.
        </Paragraph>
        <Paragraph>
          <LessonLink to="/lessons/text-search-in-postgres">
            Text search in Postgres
          </LessonLink>{" "}
          compares all the approaches and combines full-text with vector search.
        </Paragraph>
      </LessonSection>
    </CourseLessonPage>
  );
}
