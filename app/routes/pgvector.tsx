import {
  databaseInit,
  examples,
  exercises,
  hnswIndex,
  indexedDatabaseInit,
  ivfflatDatabaseInit,
  ivfflatIndex,
  migration,
  realWorld,
  seed,
  smallerVectorIndexes,
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
import { HnswDiagram, IvfflatDiagram } from "../sql/vector-index-diagrams";

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
          concept: "Exact search",
          description: "no index: always the true nearest rows, but every row is read.",
        },
        {
          concept: "HNSW index",
          url: "https://github.com/pgvector/pgvector#hnsw",
          description: "a layered graph of neighbours: fast, approximate, slow to build.",
        },
        {
          concept: "IVFFlat index",
          url: "https://github.com/pgvector/pgvector#ivfflat",
          description:
            "lists around centroids: quick to build, approximate, create it after the data.",
        },
        {
          concept: "halfvec, bit",
          url: "https://github.com/pgvector/pgvector#half-precision-vectors",
          description:
            "smaller vectors: less space, less precision; re-rank with the full ones.",
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
          questions. Only the column type changes. Then four ways to search many rows:
          exact, HNSW, IVFFlat, and smaller vectors.
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
        <Title2 id="searching-thousands">Searching thousands of rows</Title2>
        <Paragraph>
          All the plans so far are <InlineCode>Seq Scan</InlineCode> +{" "}
          <InlineCode>Sort</InlineCode>: fine for eight rows. To compare the ways pgvector
          can search, the next examples use the eight documents plus 5,000 generated ones,
          and the same question: &quot;speed up my database&quot;.
        </Paragraph>
      </LessonSection>

      <Section>
        <Title2 id="exact-search">Exact search: no index</Title2>
        <Paragraph>
          Without a vector index, Postgres measures the distance to every row and sorts. A
          B-tree can&apos;t help: &quot;closest to this point in 1,536 dimensions&quot;
          has no sort order. Exact search is always right, and fine up to tens of
          thousands of rows.
        </Paragraph>
      </Section>
      <Example id={SQL_EXAMPLE_IDS.pgvectorExactScan} />

      <LessonSection>
        <Title2 id="hnsw">HNSW: a graph of neighbours</Title2>
        <HnswDiagram />
        <Paragraph>
          The usual choice: fast, with high recall, and it can be created on an empty
          table. Building it is slow and memory hungry.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={hnswIndex} databaseInitId={indexedDatabaseInit.id} />
        </div>
      </LessonSection>
      <Example id={SQL_EXAMPLE_IDS.pgvectorIndexScan} />
      <Section>
        <Title2 id="approximate">Approximate, on purpose</Title2>
        <Paragraph>
          To be fast, an approximate index can miss a true neighbour now and then.{" "}
          <InlineCode>SET hnsw.ef_search = 100</InlineCode> (default 40) searches more of
          the graph: better recall, slower queries. With a <InlineCode>WHERE</InlineCode>{" "}
          filter, the index returns the nearest rows first and the filter runs after, so a
          very selective filter can return fewer rows than the{" "}
          <InlineCode>LIMIT</InlineCode>; recent pgvector versions add{" "}
          <InlineCode>hnsw.iterative_scan</InlineCode> for that.
        </Paragraph>
      </Section>

      <LessonSection>
        <Title2 id="ivfflat">IVFFlat: search the nearest lists</Title2>
        <IvfflatDiagram />
        <Paragraph>
          IVFFlat partitions the vectors: it picks centroids from the rows already in the
          table, and files every vector in the list of its nearest centroid. Quicker to
          build and smaller than HNSW, but lower recall at the same speed. Create it after
          loading the data, and rebuild it when the data changes a lot: centroids picked
          from an empty or different table describe the wrong clusters.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={ivfflatIndex} databaseInitId={ivfflatDatabaseInit.id} />
        </div>
      </LessonSection>
      <Example id={SQL_EXAMPLE_IDS.pgvectorIvfflatScan} />

      <LessonSection>
        <Title2 id="smaller-vectors">Smaller vectors: halfvec and bits</Title2>
        <Paragraph>
          A 1,536-dimension <InlineCode>vector</InlineCode> takes 6 KB per row, and HNSW
          indexes stop at 2,000 dimensions. pgvector has smaller types:{" "}
          <InlineCode>halfvec</InlineCode> stores 16 bits per number (half the space,
          indexes up to 4,000 dimensions), and <InlineCode>bit</InlineCode> stores 1 bit
          per number (32 times smaller, much rougher).
        </Paragraph>
      </LessonSection>
      <Example id={SQL_EXAMPLE_IDS.pgvectorSmallerVectors} />
      <Example id={SQL_EXAMPLE_IDS.pgvectorBinaryRerank} />
      <Section>
        <Title2 id="smaller-vector-indexes">Indexing smaller vectors</Title2>
        <Paragraph>
          You don&apos;t need a second column: index an expression that casts the
          embedding, and use the same expression in the query.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={smallerVectorIndexes} />
        </div>
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
