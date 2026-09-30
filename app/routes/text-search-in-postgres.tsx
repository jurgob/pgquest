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

type ApproachSummary = {
  name: string;
  summary: React.ReactNode;
  pros: readonly React.ReactNode[];
  cons: readonly React.ReactNode[];
  lesson?: { href: string; label: string };
};

const textApproaches: readonly ApproachSummary[] = [
  {
    name: "ILIKE",
    summary: "Finds a piece of text anywhere in a column.",
    pros: [
      "Built in, nothing to set up.",
      "Exact and predictable.",
      <>
        With a trigram index, fast even for <InlineCode>&apos;%...%&apos;</InlineCode>.
      </>,
    ],
    cons: [
      "No ranking.",
      "No typos, no word forms: 'indexing' doesn't find 'Indexes'.",
      "Without an index, it reads every row.",
    ],
    lesson: { href: "/lessons/text-search-basics", label: "Text search basics" },
  },
  {
    name: "Fuzzy search (pg_trgm)",
    summary: "Compares strings by the 3-letter chunks they share.",
    pros: [
      "Tolerates typos.",
      "Gives a score to sort by.",
      "Great for short text: names, titles, autocomplete.",
    ],
    cons: [
      "Knows nothing about words or meaning.",
      "Weak on long text and on very short queries.",
      "Trigram indexes are large.",
    ],
    lesson: { href: "/lessons/fuzzy-search", label: "Fuzzy search with pg_trgm" },
  },
  {
    name: "Full-text search",
    summary: "Matches words and their forms: 'indexing' finds 'Indexes'.",
    pros: [
      "Built in.",
      "Stemming, stop words, search-box syntax (quotes, OR, -word).",
      "Ranking and highlighting.",
      "A GIN index scales to millions of rows.",
    ],
    cons: [
      "No typos, no synonyms, no meaning.",
      "One language configuration per tsvector.",
      "Basic ranking: no BM25 out of the box.",
    ],
    lesson: { href: "/lessons/full-text-search", label: "Full-text search" },
  },
];

const vectorApproaches: readonly ApproachSummary[] = [
  {
    name: "Arrays and SQL functions",
    summary: "Embeddings in a DOUBLE PRECISION[] column, distance written in SQL.",
    pros: ["No extension: works on any Postgres.", "Every step of the math is visible."],
    cons: [
      "No index: every search computes the distance for every row.",
      "Nothing checks that vectors have the same number of dimensions.",
    ],
    lesson: { href: "/lessons/vectors", label: "Vectors" },
  },
  {
    name: "pgvector, no index",
    summary: "A vector column and distance operators, searched by a full scan.",
    pros: [
      "Exact results: always the true nearest rows.",
      "Simple: fine up to tens of thousands of rows.",
      "Type checking and fast distance operators.",
    ],
    cons: ["Cost grows with rows × dimensions: every search reads the whole table."],
    lesson: { href: "/lessons/pgvector", label: "pgvector" },
  },
  {
    name: "pgvector + HNSW index",
    summary: "A graph of neighbours that a search walks towards the question.",
    pros: [
      "Fast, with high recall.",
      "Can be created on an empty table; stays good as rows arrive.",
      <>
        Tunable at query time with <InlineCode>hnsw.ef_search</InlineCode>.
      </>,
    ],
    cons: [
      "Approximate: can miss a true neighbour.",
      "Slow to build, and uses a lot of memory.",
      "A selective WHERE filter can return fewer rows than the LIMIT.",
    ],
    lesson: { href: "/lessons/pgvector#an-index", label: "pgvector" },
  },
  {
    name: "pgvector + IVFFlat index",
    summary: "Groups vectors into clusters and only searches the nearest ones.",
    pros: ["Faster to build and smaller than HNSW."],
    cons: [
      "Must be created after the data is loaded: the clusters come from it.",
      "Lower recall than HNSW at the same speed.",
      "Needs rebuilding when the data changes a lot.",
    ],
  },
  {
    name: "Smaller vectors (halfvec, binary quantization)",
    summary: "Store each number in 16 bits, or even 1 bit, instead of 32.",
    pros: [
      "Half the storage with halfvec, 1/32 with bits; faster indexes.",
      "halfvec indexes up to 4,000 dimensions; vector stops at 2,000.",
    ],
    cons: [
      "Some accuracy lost.",
      "Binary quantization usually needs a second pass that re-ranks with the full vectors.",
    ],
  },
  {
    name: "Embeddings computed in the database (pgai)",
    summary:
      "The database calls the embedding model itself, for every new or changed row.",
    pros: ["Embeddings stay in sync automatically, like an index.", "No app code."],
    cons: [
      "The database calls an external API: latency, API keys, and failures inside Postgres.",
      "pgai has not been maintained since February 2026.",
    ],
  },
];

const hybridApproach: ApproachSummary = {
  name: "Hybrid: full-text + vectors",
  summary: "Runs both searches and merges the two rankings.",
  pros: ["Exact words and names, and meaning when the words differ.", "One SQL query."],
  cons: [
    "Two indexes and two searches to tune.",
    "Still needs an embedding for every document and every search.",
  ],
};

function ApproachCard({ approach }: { approach: ApproachSummary }) {
  return (
    <div className="rounded-md border border-zinc-200 p-4">
      <h3 className="text-lg font-semibold text-zinc-950">{approach.name}</h3>
      <p className="mt-1 text-base leading-7 text-zinc-800">{approach.summary}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="font-mono text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Pros
          </h4>
          <ul className="mt-1 list-disc pl-5 text-sm leading-6 text-zinc-800">
            {approach.pros.map((pro, index) => (
              <li key={index}>{pro}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-xs font-semibold uppercase tracking-wide text-rose-700">
            Cons
          </h4>
          <ul className="mt-1 list-disc pl-5 text-sm leading-6 text-zinc-800">
            {approach.cons.map((con, index) => (
              <li key={index}>{con}</li>
            ))}
          </ul>
        </div>
      </div>
      {approach.lesson ? (
        <p className="mt-3 text-sm text-zinc-700">
          Lesson:{" "}
          <LessonLink to={approach.lesson.href}>{approach.lesson.label}</LessonLink>
        </p>
      ) : null}
    </div>
  );
}

function ApproachCards({ approaches }: { approaches: readonly ApproachSummary[] }) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      {approaches.map((approach) => (
        <ApproachCard approach={approach} key={approach.name} />
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
          PostgreSQL can often do the job itself. First, every approach in brief, with its
          pros and cons, and a table to compare them. Then all of them on one table, with
          the same eight documents as the previous lessons. It repeats a little of each
          lesson on purpose; follow the links for the details.
        </p>
      </Paragraphs>

      <LessonSection>
        <Title2 id="the-approaches">The approaches</Title2>
        <Paragraph>Keyword search: match the text the user typed.</Paragraph>
        <ApproachCards approaches={textApproaches} />
      </LessonSection>

      <LessonSection>
        <Title2 id="vector-approaches">Vector search, in several flavours</Title2>
        <Paragraph>
          Vector search matches meaning. Every flavour needs an embedding model to turn
          text into a vector, for every document and for every search: an extra
          dependency, with its own cost and latency. They differ in how the vectors are
          stored and searched, and in who computes them.
        </Paragraph>
        <ApproachCards approaches={vectorApproaches} />
      </LessonSection>

      <LessonSection>
        <Title2 id="hybrid-approach">Both at once</Title2>
        <ApproachCards approaches={[hybridApproach]} />
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
