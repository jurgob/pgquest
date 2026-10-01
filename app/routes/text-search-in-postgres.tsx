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
  Title2,
} from "../sql/lesson-layout";
import { SqlCodeViewer } from "../sql/sql-editor";

function Example({ id }: { id: SqlExampleId }) {
  return <ExampleBlock example={getSqlExample(examples, id)} />;
}

// The overview: one line per idea, examples on this lesson's eight documents.
type ApproachSummary = {
  name: string;
  summary: string;
  // "search" → what comes back.
  examples: readonly (readonly [string, string])[];
  warning?: string;
  pros: string;
  cons: string;
  lesson?: { href: string; label: string };
};

const approachGroups: readonly {
  title: string;
  intro?: string;
  approaches: readonly ApproachSummary[];
}[] = [
  {
    title: "Keyword search",
    approaches: [
      {
        name: "ILIKE",
        summary: "Finds a piece of text anywhere.",
        examples: [
          ["index", "SQL indexes, Query tuning"],
          ["indexing", "nothing"],
        ],
        pros: "built in, exact",
        cons: "no ranking, no typos, no word forms",
        lesson: { href: "/lessons/text-search-basics", label: "Text search basics" },
      },
      {
        name: "Fuzzy search (pg_trgm)",
        summary: "Matches similar spellings.",
        examples: [
          ["nueral netwrks", "Neural networks"],
          ["speed up my database", "nothing"],
        ],
        pros: "forgives typos, great for names and autocomplete",
        cons: "no meaning, weak on long text",
        lesson: { href: "/lessons/fuzzy-search", label: "Fuzzy search" },
      },
      {
        name: "Full-text search",
        summary: "Matches words and their forms.",
        examples: [
          ["indexing tables", "SQL indexes"],
          ["postgress", "nothing"],
        ],
        pros: "built in, ranking, search-box syntax, scales",
        cons: "no typos, no synonyms, no meaning",
        lesson: { href: "/lessons/full-text-search", label: "Full-text search" },
      },
    ],
  },
  {
    title: "Vector search",
    intro:
      "Matches meaning. Every flavour needs an embedding model for each document and each search.",
    approaches: [
      {
        name: "Arrays + SQL functions",
        summary: "Plain arrays, distance written by hand.",
        examples: [["speed up my database", "JOIN patterns, SQL indexes, Query tuning"]],
        pros: "no extension",
        cons: "no index: every search reads every row",
        lesson: { href: "/lessons/vectors", label: "Vectors" },
      },
      {
        name: "pgvector, no index",
        summary: "A vector type, searched by a full scan.",
        examples: [["speed up my database", "the same three, always exact"]],
        pros: "exact, simple",
        cons: "slow beyond tens of thousands of rows",
        lesson: { href: "/lessons/pgvector", label: "pgvector" },
      },
      {
        name: "pgvector + HNSW",
        summary: "A graph index walked towards the question.",
        examples: [["speed up my database", "the same three, fast on millions of rows"]],
        warning: "approximate: can miss a neighbour, or return fewer rows with a filter",
        pros: "fast, high recall",
        cons: "slow to build, memory hungry",
        lesson: { href: "/lessons/pgvector", label: "pgvector" },
      },
      {
        name: "pgvector + IVFFlat",
        summary: "Clusters vectors, searches the nearest clusters.",
        examples: [["speed up my database", "the same three"]],
        warning: "built on an empty table, results get poor",
        pros: "quick to build, small",
        cons: "lower recall, rebuild as data changes",
      },
      {
        name: "halfvec / binary quantization",
        summary: "Smaller numbers: 16 bits or 1 bit instead of 32.",
        examples: [["speed up my database", "the same three with halfvec"]],
        warning: "in binary, 7 of these 8 documents become the same bits: re-rank",
        pros: "½ or 1/32 of the storage",
        cons: "less accurate",
      },
      {
        name: "pgai",
        summary: "The database computes embeddings itself.",
        examples: [["speed up my database", "the same three, embedded by Postgres"]],
        warning: "if the model API fails, rows go unembedded and unfound",
        pros: "always in sync, no app code",
        cons: "API calls inside Postgres; unmaintained since Feb 2026",
      },
    ],
  },
  {
    title: "Hybrid",
    approaches: [
      {
        name: "Full-text + vectors",
        summary: "Runs both and merges the rankings.",
        examples: [["find meaning", "Vector search first: top of both lists"]],
        pros: "exact words and meaning",
        cons: "two searches to tune, still needs embeddings",
      },
    ],
  },
];

function ApproachOverview() {
  return (
    <div className="flex flex-col gap-6">
      {approachGroups.map((group) => (
        <div key={group.title}>
          <h3 className="text-lg font-semibold text-zinc-950">{group.title}</h3>
          {group.intro ? (
            <p className="mt-1 text-base leading-7 text-zinc-800">{group.intro}</p>
          ) : null}
          <ul className="mt-3 flex flex-col gap-4">
            {group.approaches.map((approach) => (
              <li className="text-sm leading-6 text-zinc-800" key={approach.name}>
                <span className="font-semibold text-zinc-950">{approach.name}</span>:{" "}
                {approach.summary}
                {approach.lesson ? (
                  <>
                    {" "}
                    <LessonLink to={approach.lesson.href}>
                      {approach.lesson.label}
                    </LessonLink>
                  </>
                ) : null}
                <div>
                  {approach.examples.map(([search, result], index) => (
                    <span key={search}>
                      {index > 0 ? " · " : null}
                      <span className="font-mono">&quot;{search}&quot;</span> → {result}
                    </span>
                  ))}
                  {approach.warning ? (
                    <span className="text-amber-800"> · ⚠ {approach.warning}</span>
                  ) : null}
                </div>
                <div>
                  <span className="text-emerald-700">+ {approach.pros}</span>
                  <span className="text-zinc-400"> · </span>
                  <span className="text-rose-700">− {approach.cons}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
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
    lessons: [{ href: `#${SQL_EXAMPLE_IDS.textSearchInPostgresHybrid}`, label: "Below" }],
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
          PostgreSQL can often do the job itself. First, every approach in brief, and a
          table to compare them. Then all of them on one table, with the same eight
          documents as the previous lessons.
        </p>
      </Paragraphs>

      <LessonSection>
        <Title2 id="the-approaches">The approaches</Title2>
        <ApproachOverview />
      </LessonSection>

      <LessonSection>
        <Title2 id="comparison">Comparison</Title2>
        <ComparisonTable />
        <Paragraph>
          They are not exclusive: one table can have all of them, as the one below does.
          Start with the simplest one that answers what your users type, and add the next
          when search results show you why.
        </Paragraph>
      </LessonSection>

      <LessonSection>
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
      </LessonSection>

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
