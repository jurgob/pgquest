import {
  databaseInit,
  examples,
  exercises,
  indexedDatabaseInit,
  migration,
  seed,
  trigramIndexes,
} from "../../cli_examples/fuzzy-search.sql";
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

export default function FuzzySearch() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="fuzzy-search"
      whatWeLearned={[
        {
          concept: "pg_trgm",
          url: "https://www.postgresql.org/docs/current/pgtrgm.html",
          description: "compares strings by the 3-letter chunks they share.",
        },
        {
          concept: "similarity() and %",
          description:
            "a 0-to-1 score for two whole strings, and a threshold test on it.",
        },
        {
          concept: "word_similarity() and <%",
          description: "the best match for a word anywhere inside a longer text.",
        },
        {
          concept: "<->",
          description: (
            <>
              trigram distance, for <InlineCode>ORDER BY ... LIMIT</InlineCode> &quot;did
              you mean&quot; lookups.
            </>
          ),
        },
        {
          concept: "gin_trgm_ops, gist_trgm_ops",
          description: (
            <>
              trigram indexes: GIN for <InlineCode>%</InlineCode> and{" "}
              <InlineCode>ILIKE</InlineCode>, GiST also for ordering by distance.
            </>
          ),
        },
      ]}
    >
      <Paragraphs>
        <p>
          Users make typos.{" "}
          <LessonLink to="/lessons/text-search-basics">ILIKE</LessonLink> and{" "}
          <LessonLink to="/lessons/full-text-search">full-text search</LessonLink> both
          need the right spelling: &quot;postgress&quot; finds nothing. The pg_trgm
          extension compares strings by how many 3-letter chunks, trigrams, they share, so
          a word with a letter missing or swapped still scores close to the original.
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

      <Example id={SQL_EXAMPLE_IDS.fuzzySearchShowTrgm} />
      <Example id={SQL_EXAMPLE_IDS.fuzzySearchSimilarity} />
      <Example id={SQL_EXAMPLE_IDS.fuzzySearchPercent} />
      <Example id={SQL_EXAMPLE_IDS.fuzzySearchWordSimilarity} />
      <Example id={SQL_EXAMPLE_IDS.fuzzySearchDidYouMean} />

      <LessonSection>
        <Title2 id="trigram-indexes">Trigram indexes</Title2>
        <Paragraph>
          Without an index, every function above scores every row. pg_trgm comes with two
          operator classes. The{" "}
          <LessonLink to="/lessons/slow-queries">slow queries lesson</LessonLink> uses the
          GIN one to fix a slow <InlineCode>ILIKE</InlineCode> search.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={trigramIndexes} databaseInitId={indexedDatabaseInit.id} />
        </div>
      </LessonSection>

      <Example id={SQL_EXAMPLE_IDS.fuzzySearchIlikeIndex} />
      <Example id={SQL_EXAMPLE_IDS.fuzzySearchGistOrder} />

      <LessonSection>
        <Title2 id="when-to-use-it">When to use it</Title2>
        <Paragraph>
          Trigrams are good at short strings where spelling matters: names, titles,
          product names, tags, autocomplete, &quot;did you mean&quot;. They know nothing
          about words or meaning: &quot;running&quot; and &quot;ran&quot; share few
          trigrams, which{" "}
          <LessonLink to="/lessons/full-text-search">full-text search</LessonLink>{" "}
          handles, and &quot;car&quot; and &quot;vehicle&quot; share none, which{" "}
          <LessonLink to="/lessons/vectors">vector search</LessonLink> handles.
        </Paragraph>
        <Paragraph>
          <LessonLink to="/lessons/text-search-in-postgres">
            Text search in Postgres
          </LessonLink>{" "}
          compares all the approaches side by side.
        </Paragraph>
      </LessonSection>
    </CourseLessonPage>
  );
}
