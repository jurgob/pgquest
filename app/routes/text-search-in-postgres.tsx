import {
  databaseInit,
  examples,
  exercises,
  migration,
  pgaiExample,
  seed,
} from "../../cli_examples/text-search-in-postgres.sql";
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

type Approach = {
  name: string;
  finds: string;
  typos: string;
  meaning: string;
  ranking: string;
  index: string;
  needs: string;
  lessons: readonly { href: string; label: string }[];
};

const approaches: readonly Approach[] = [
  {
    name: "ILIKE",
    finds: "Substrings",
    typos: "No",
    meaning: "No",
    ranking: "No",
    index: "Trigram GIN",
    needs: "Built in",
    lessons: [{ href: "/lessons/text-search-basics", label: "Text search basics" }],
  },
  {
    name: "pg_trgm",
    finds: "Similar spellings",
    typos: "Yes",
    meaning: "No",
    ranking: "similarity()",
    index: "GIN, GiST",
    needs: "pg_trgm (contrib)",
    lessons: [{ href: "/lessons/fuzzy-search", label: "Fuzzy search" }],
  },
  {
    name: "Full-text",
    finds: "Words and their forms",
    typos: "No",
    meaning: "No",
    ranking: "ts_rank",
    index: "GIN",
    needs: "Built in",
    lessons: [{ href: "/lessons/full-text-search", label: "Full-text search" }],
  },
  {
    name: "pgvector",
    finds: "Similar meaning",
    typos: "Mostly",
    meaning: "Yes",
    ranking: "Distance",
    index: "HNSW, IVFFlat",
    needs: "pgvector + an embedding model",
    lessons: [
      { href: "/lessons/vectors", label: "Vectors" },
      { href: "/lessons/pgvector", label: "pgvector" },
    ],
  },
  {
    name: "Hybrid",
    finds: "Words and meaning",
    typos: "Mostly",
    meaning: "Yes",
    ranking: "Rank fusion",
    index: "GIN + HNSW",
    needs: "Both of the above",
    lessons: [{ href: `#${SQL_EXAMPLE_IDS.textSearchInPostgresHybrid}`, label: "Above" }],
  },
];

const columns = [
  "Approach",
  "Finds",
  "Typos",
  "Meaning",
  "Ranking",
  "Index",
  "Needs",
  "Lesson",
] as const;

function ComparisonTable() {
  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-zinc-200">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-zinc-50">
          <tr>
            {columns.map((column) => (
              <th
                className="border-b border-zinc-200 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-zinc-500"
                key={column}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {approaches.map((approach) => (
            <tr className="border-b border-zinc-100 last:border-b-0" key={approach.name}>
              <td className="px-3 py-2 font-semibold text-zinc-950">{approach.name}</td>
              <td className="px-3 py-2 text-zinc-800">{approach.finds}</td>
              <td className="px-3 py-2 text-zinc-800">{approach.typos}</td>
              <td className="px-3 py-2 text-zinc-800">{approach.meaning}</td>
              <td className="px-3 py-2 text-zinc-800">{approach.ranking}</td>
              <td className="px-3 py-2 text-zinc-800">{approach.index}</td>
              <td className="px-3 py-2 text-zinc-800">{approach.needs}</td>
              <td className="px-3 py-2 text-zinc-800">
                {approach.lessons.map((lesson, index) => (
                  <span key={lesson.href}>
                    {index > 0 ? ", " : null}
                    {lesson.href.startsWith("#") ? (
                      <a
                        className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
                        href={lesson.href}
                      >
                        {lesson.label}
                      </a>
                    ) : (
                      <LessonLink to={lesson.href}>{lesson.label}</LessonLink>
                    )}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TextSearchInPostgres() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="text-search-in-postgres"
      whatWeLearned={[
        {
          concept: "One database",
          description:
            "search lives next to the data: no sync pipeline, no stale index, the same transactions and permissions.",
        },
        {
          concept: "Pick by what users type",
          description:
            "exact fragments: ILIKE. Typos: pg_trgm. Words: full-text. Meaning: pgvector.",
        },
        {
          concept: "Hybrid search",
          description:
            "full-text and vector rankings merged with reciprocal rank fusion, in one query.",
        },
        {
          concept: "Embeddings come from outside",
          description:
            "a model computes them; your app (or a tool like pgai) stores them in a vector column.",
        },
      ]}
    >
      <Paragraphs>
        <p>
          When an app needs search, many teams add a search engine: Elasticsearch or
          OpenSearch (with Kibana to look at it), Algolia, Typesense, Meilisearch. That is
          a second datastore. Every write has to be copied to it, by a queue, a sync job
          or change data capture, and results are stale until the copy lands. It has its
          own bill, its own backups, its own access rules to keep in step with the
          database&apos;s, and it can&apos;t join search results with the rest of your
          data.
        </p>
        <p className="mt-3">
          PostgreSQL can often do the job itself. This lesson puts every approach from the
          previous lessons on one table, with the same eight documents, so you can compare
          them side by side. It repeats a little of each lesson on purpose; follow the
          links for the details.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="one-table">One table, every kind of search</Title2>
        <Paragraph>
          A trigram index for <InlineCode>ILIKE</InlineCode> and typos, a tsvector column
          for words, an embedding for meaning. Postgres keeps all three up to date in the
          same transaction as the row itself.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={migration} />
        </div>
        <div className="mt-4">
          <SqlCodeViewer code={seed} databaseInitId={databaseInit.id} />
        </div>
      </Section>

      <Example id={SQL_EXAMPLE_IDS.textSearchInPostgresIlike} />
      <Paragraph>
        Details:{" "}
        <LessonLink to="/lessons/text-search-basics">Text search basics</LessonLink>.
      </Paragraph>
      <Example id={SQL_EXAMPLE_IDS.textSearchInPostgresFuzzy} />
      <Paragraph>
        Details:{" "}
        <LessonLink to="/lessons/fuzzy-search">Fuzzy search with pg_trgm</LessonLink>.
      </Paragraph>
      <Example id={SQL_EXAMPLE_IDS.textSearchInPostgresFullText} />
      <Paragraph>
        Details: <LessonLink to="/lessons/full-text-search">Full-text search</LessonLink>.
      </Paragraph>
      <Example id={SQL_EXAMPLE_IDS.textSearchInPostgresSemantic} />
      <Paragraph>
        Details: <LessonLink to="/lessons/vectors">Vectors</LessonLink> for the math,{" "}
        <LessonLink to="/lessons/pgvector">pgvector</LessonLink> for the type and index.
      </Paragraph>
      <Example id={SQL_EXAMPLE_IDS.textSearchInPostgresHybrid} />
      <Paragraph>
        Full-text search is precise on exact words and names; vector search catches
        meaning when the words differ. Hybrid search runs both and merges the rankings.
        Reciprocal rank fusion only uses positions, so the two scores never need to be on
        the same scale. The 60 is the usual constant: it keeps one list&apos;s top result
        from drowning out the other list.
      </Paragraph>

      <LessonSection>
        <Title2 id="where-embeddings-come-from">Where embeddings come from</Title2>
        <Paragraph>
          Every approach except vectors works on the text alone. Vectors need a model to
          compute the embedding of each document, and of each search. Usually the app does
          it: call the model, then <InlineCode>INSERT</InlineCode> the vector, as shown in
          the <LessonLink to="/lessons/pgvector">pgvector lesson</LessonLink>.
        </Paragraph>
        <Paragraph>
          Timescale&apos;s pgai took the other route: a vectorizer, declared in SQL, that
          watches a table and keeps an embeddings table in sync by calling the model for
          every new or changed row. It can&apos;t run here, since it calls a model API
          from the database, and the project has not been maintained since February 2026.
          The idea is still worth knowing: treat embeddings like an index that the system
          keeps up to date.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={pgaiExample} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="comparison">Comparison</Title2>
        <ComparisonTable />
        <Paragraph>
          They are not exclusive: one table can have all of them, as this one does. Start
          with the simplest one that answers what your users type, and add the next when
          search results show you why.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="when-postgres-is-not-enough">When Postgres is not enough</Title2>
        <Paragraph>
          A dedicated search engine still earns its place when search is the product:
          hundreds of millions of documents with heavy query traffic that you want off the
          main database, faceted navigation with live counts on every filter, per-language
          analyzers and synonyms tuned by a search team, log analytics and dashboards
          (what Kibana is really for), or a hosted instant-search UI you don&apos;t want
          to build. Below that, which is most apps, Postgres search is one less system to
          run, and it is always consistent with your data.
        </Paragraph>
      </LessonSection>
    </CourseLessonPage>
  );
}
