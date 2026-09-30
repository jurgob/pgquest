import {
  databaseInit,
  examples,
  exercises,
  hnswIndex,
  indexedDatabaseInit,
  migration,
  realWorld,
  seed,
} from "../../cli_examples/pgvector.sql";
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

export default function Pgvector() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="pgvector"
      whatWeLearned={[
        {
          concept: "vector(n)",
          url: "https://github.com/pgvector/pgvector",
          description: "a column type for embeddings, with a fixed number of dimensions.",
        },
        {
          concept: "<->",
          description: "L2 (Euclidean) distance.",
        },
        {
          concept: "<=>",
          description:
            "cosine distance: 1 - cosine similarity. The usual choice for text.",
        },
        {
          concept: "<#>",
          description: "negative inner product: fastest, for vectors of length 1.",
        },
        {
          concept: "HNSW index",
          url: "https://github.com/pgvector/pgvector#hnsw",
          description: (
            <>
              approximate nearest-neighbour search: an <InlineCode>Index Scan</InlineCode>{" "}
              ordered by distance instead of a full sort.
            </>
          ),
        },
      ]}
    >
      <Paragraphs>
        <p>
          The <LessonLink to="/lessons/vectors">vectors lesson</LessonLink> computed
          distances by hand, with arrays. It worked, but every search read and sorted
          every row. pgvector is the PostgreSQL extension that turns this into a real
          feature: a <InlineCode>vector</InlineCode> column type, distance operators, and
          indexes that find the nearest rows without reading them all.
        </p>
        <p className="mt-3">
          Same eight documents, same hand-made embeddings ([databases, web, AI]), same
          questions. Only the column type changes.
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

      <Example id={SQL_EXAMPLE_IDS.pgvectorNearest} />
      <Example id={SQL_EXAMPLE_IDS.pgvectorOperators} />

      <Section>
        <Title2 id="which-operator">Which operator?</Title2>
        <Paragraph>
          Use the one your embedding model was trained for; its documentation says. Most
          text models, including OpenAI&apos;s, return vectors of length 1, and then all
          three give the same order. <InlineCode>&lt;=&gt;</InlineCode> is the safe
          default. With length-1 vectors, <InlineCode>&lt;#&gt;</InlineCode> gives the
          same order and skips a division.
        </Paragraph>
      </Section>

      <Example id={SQL_EXAMPLE_IDS.pgvectorHelpers} />
      <Example id={SQL_EXAMPLE_IDS.pgvectorMoreLikeThis} />

      <LessonSection>
        <Title2 id="an-index">An index for nearest neighbours</Title2>
        <Paragraph>
          All the plans so far are <InlineCode>Seq Scan</InlineCode> +{" "}
          <InlineCode>Sort</InlineCode>: fine for eight rows. A B-tree can&apos;t help:
          &quot;closest to this point in 1,536 dimensions&quot; has no sort order.
          pgvector adds two index types: HNSW (better recall and speed, slower to build)
          and IVFFlat (fast to build, needs data before you create it). Start with HNSW.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={hnswIndex} databaseInitId={indexedDatabaseInit.id} />
        </div>
      </LessonSection>

      <Example id={SQL_EXAMPLE_IDS.pgvectorIndexScan} />

      <Section>
        <Title2 id="approximate">Approximate, on purpose</Title2>
        <Paragraph>
          HNSW is an approximate index: to be fast, it can miss a true neighbour now and
          then. <InlineCode>SET hnsw.ef_search = 100</InlineCode> (default 40) searches
          more of the graph: better recall, slower queries. With a{" "}
          <InlineCode>WHERE</InlineCode> filter, the index returns the nearest rows first
          and the filter runs after, so a very selective filter can return fewer rows than
          the <InlineCode>LIMIT</InlineCode>; recent pgvector versions add{" "}
          <InlineCode>hnsw.iterative_scan</InlineCode> for that.
        </Paragraph>
      </Section>

      <LessonSection>
        <Title2 id="in-a-real-app">In a real app</Title2>
        <Paragraph>
          The only differences are the number of dimensions and where the numbers come
          from: your app sends the text to an embedding model and stores the result.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={realWorld} />
        </div>
        <Paragraph>
          Vector search finds meaning, but it misses exact words, product codes and names.{" "}
          <LessonLink to="/lessons/full-text-search">Full-text search</LessonLink> and{" "}
          <LessonLink to="/lessons/fuzzy-search">fuzzy search</LessonLink> are better at
          those, and{" "}
          <LessonLink to="/lessons/text-search-in-postgres">
            Text search in Postgres
          </LessonLink>{" "}
          combines them.
        </Paragraph>
      </LessonSection>
    </CourseLessonPage>
  );
}
