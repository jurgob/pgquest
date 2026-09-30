import {
  databaseInit,
  examples,
  exercises,
  functions,
  migration,
  seed,
} from "../../cli_examples/vectors.sql";
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

export default function Vectors() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="vectors"
      whatWeLearned={[
        {
          concept: "Embedding",
          description:
            "a list of numbers produced by a model, so that texts with similar meaning get nearby vectors.",
        },
        {
          concept: "L2 distance",
          description:
            "the straight-line distance between two vectors: smaller is closer.",
        },
        {
          concept: "Cosine similarity",
          description:
            "compares the direction of two vectors, ignoring their length: 1 is identical.",
        },
        {
          concept: "Nearest neighbours",
          description: (
            <>
              <InlineCode>ORDER BY distance LIMIT k</InlineCode>: the whole of vector
              search.
            </>
          ),
        },
        {
          concept: "Cutoff",
          description:
            "nearest neighbours always return rows; a WHERE on the distance keeps only good ones.",
        },
        {
          concept: "pgvector",
          description: "the PostgreSQL extension that makes all of this fast.",
          url: "https://github.com/pgvector/pgvector",
        },
      ]}
    >
      <Paragraphs>
        <p>
          Keyword search matches characters. Vector search matches meaning. An embedding
          model reads a text and returns a list of numbers, a vector, chosen so that texts
          with similar meaning get vectors that are close together. Searching then means:
          turn the question into a vector too, and return the rows whose vectors are
          nearest.
        </p>
        <p className="mt-3">
          Real models return hundreds or thousands of numbers that no human can name. Here
          each document has three hand-made ones, so you can read them: how much it is
          about databases, the web, and AI. The lesson uses plain PostgreSQL arrays so
          every step of the math is visible. The{" "}
          <LessonLink to="/lessons/pgvector">pgvector lesson</LessonLink> does the same
          search with a real vector type and index.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="the-documents">The documents</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={migration} />
        </div>
        <div className="mt-4">
          <SqlCodeViewer code={seed} />
        </div>
      </Section>

      <Example id={SQL_EXAMPLE_IDS.vectorsShowEmbeddings} />
      <Example id={SQL_EXAMPLE_IDS.vectorsKeywordsMiss} />
      <Example id={SQL_EXAMPLE_IDS.vectorsDistanceScore} />

      <Section>
        <Title2 id="distance-functions">Distance as a function</Title2>
        <Paragraph>
          Writing every dimension by hand stops working at 1,536 dimensions. Two SQL
          functions do the same math for arrays of any length:
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={functions} databaseInitId={databaseInit.id} />
        </div>
      </Section>

      <Example id={SQL_EXAMPLE_IDS.vectorsNearestVector} />
      <Example id={SQL_EXAMPLE_IDS.vectorsCosineSimilarity} />
      <Example id={SQL_EXAMPLE_IDS.vectorsCutoff} />
      <Example id={SQL_EXAMPLE_IDS.vectorsMoreLikeThis} />

      <LessonSection>
        <Title2 id="why-pgvector">Why arrays are not enough</Title2>
        <Paragraph>
          Look at the plans above: every search is a <InlineCode>Seq Scan</InlineCode>{" "}
          followed by a <InlineCode>Sort</InlineCode>. Postgres computes the distance for
          every row, and nothing can index an expression like{" "}
          <InlineCode>l2_distance(embedding, ...)</InlineCode>. Fine for eight rows, slow
          for a million. Arrays also don&apos;t check that every embedding has the same
          number of dimensions.
        </Paragraph>
        <Paragraph>
          The <LessonLink to="/lessons/pgvector">pgvector lesson</LessonLink> fixes both,
          with the same documents and the same questions. To see how vectors compare with
          keyword, fuzzy, and full-text search, read{" "}
          <LessonLink to="/lessons/text-search-in-postgres">
            Text search in Postgres
          </LessonLink>
          .
        </Paragraph>
      </LessonSection>
    </CourseLessonPage>
  );
}
