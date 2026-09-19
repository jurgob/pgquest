import { Link } from "react-router";
import {
  crossJoinQuery,
  databaseInit,
  exercises,
  fullOuterJoinQuery,
  innerJoinQuery,
  leftJoinQuery,
  previewAuthorsQuery,
  previewBooksQuery,
  rightJoinQuery,
} from "../../cli_examples/joins.sql";
import {
  CrossJoinDiagram,
  type JoinVennMode,
  JoinVennDiagram,
} from "../sql/join-venn-diagram";
import {
  InlineCode,
  LessonSection,
  Paragraph,
  Paragraphs,
  Section,
  slugify,
  Title2,
} from "../sql/lesson-layout";
import { CourseLessonPage } from "../sql/course-lesson-page";
import { SqlCodeViewer } from "../sql/sql-editor";
import { SqlResult, useLessonSqlExample } from "../sql/use-lesson-sql-example";

const JOIN_TYPES: {
  keeps: string;
  keyword: string;
}[] = [
  { keeps: "Only rows that match on both sides.", keyword: "INNER JOIN" },
  { keeps: "Every row from the left table, matched or not.", keyword: "LEFT JOIN" },
  { keeps: "Every row from the right table, matched or not.", keyword: "RIGHT JOIN" },
  { keeps: "Every row from both tables, matched or not.", keyword: "FULL OUTER JOIN" },
  {
    keeps: "Every combination of rows from both tables — no ON, no matching.",
    keyword: "CROSS JOIN",
  },
];

export default function TypesOfJoins() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="joins"
      whatWeLearned={[
        {
          concept: "INNER JOIN",
          description: "keeps only rows where both sides match.",
          url: "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN",
        },
        {
          concept: "LEFT / RIGHT JOIN",
          description: "keep every row from one named side, filling the other with NULL.",
          url: "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN",
        },
        {
          concept: "FULL OUTER JOIN",
          description: "keeps every row from both sides, filling gaps with NULL.",
          url: "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN",
        },
        {
          concept: "CROSS JOIN",
          description: "pairs every row from one table with every row from the other.",
          url: "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN",
        },
        {
          concept: "NULLS LAST",
          description:
            "an ORDER BY option that sorts NULL values to the end instead of the default first.",
          url: "https://www.postgresql.org/docs/current/queries-order.html",
        },
      ]}
    >
      <Paragraphs>
        <p>
          As we saw in{" "}
          <Link
            className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
            to="/lessons/introduction-to-join"
          >
            Introduction to JOIN
          </Link>
          , a JOIN combines rows from two tables using a matching column. There we used{" "}
          <InlineCode>JOIN</InlineCode>, which is short for{" "}
          <InlineCode>INNER JOIN</InlineCode> — the default, but not the only option.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="types-of-join">Types of JOIN</Title2>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Keyword
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  What it keeps
                </th>
              </tr>
            </thead>
            <tbody>
              {JOIN_TYPES.map((row) => (
                <tr key={row.keyword}>
                  <td className="border-b border-zinc-100 px-3 py-2 font-mono">
                    {row.keyword}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">
                    {row.keeps}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <LessonSection>
        <Title2 id="a-real-scenario">A real scenario</Title2>
        <Paragraphs>
          <p>
            Some authors have no book yet, and one book has no listed author. Watch what
            each JOIN type does with those gaps.
          </p>
        </Paragraphs>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <PreviewTable name="authors" query={previewAuthorsQuery} />
          <PreviewTable name="books" query={previewBooksQuery} />
        </div>
      </LessonSection>

      <JoinExample
        description="Agatha Christie and Beowulf both disappear: neither has a match on the other side."
        keyword="INNER JOIN"
        mode="inner"
        query={innerJoinQuery}
      />
      <JoinExample
        description="Agatha Christie survives with a NULL title. Beowulf is still gone — it isn't on the left."
        keyword="LEFT JOIN"
        mode="left"
        query={leftJoinQuery}
      />
      <JoinExample
        description="Same tables, same column order — only the join keyword changed. Beowulf survives with a NULL name; Agatha Christie is gone."
        keyword="RIGHT JOIN"
        mode="right"
        query={rightJoinQuery}
      />
      <JoinExample
        description="Nobody is left out. Agatha Christie and Beowulf both survive, each with a NULL on the missing side."
        keyword="FULL OUTER JOIN"
        mode="full"
        query={fullOuterJoinQuery}
      />

      <CrossJoinExample />
    </CourseLessonPage>
  );
}

function PreviewTable({ name, query }: { name: string; query: string }) {
  const execution = useLessonSqlExample({ query, sqlLoad: databaseInit.query });

  return (
    <div>
      <Title2 id={slugify(name)}>{name}</Title2>
      <SqlCodeViewer code={query} databaseInitId={databaseInit.id} />
      <div className="mt-4">
        <SqlResult execution={execution} />
      </div>
    </div>
  );
}

function CrossJoinExample() {
  const execution = useLessonSqlExample({
    query: crossJoinQuery,
    sqlLoad: databaseInit.query,
  });

  return (
    <LessonSection>
      <Title2 id="cross-join">CROSS JOIN</Title2>
      <Paragraph>
        No <InlineCode>ON</InlineCode> clause, so nothing is matched or excluded: every
        author pairs with every book. 3 authors × 4 books = 12 rows.
      </Paragraph>
      <SqlCodeViewer code={crossJoinQuery} databaseInitId={databaseInit.id} />
      <div className="mt-4 grid gap-6 md:grid-cols-[300px_1fr] md:items-start">
        <CrossJoinDiagram
          leftCount={3}
          leftLabel="authors"
          rightCount={4}
          rightLabel="books"
        />
        <SqlResult execution={execution} />
      </div>
    </LessonSection>
  );
}

function JoinExample({
  description,
  keyword,
  mode,
  query,
}: {
  description: string;
  keyword: string;
  mode: JoinVennMode;
  query: string;
}) {
  const execution = useLessonSqlExample({ query, sqlLoad: databaseInit.query });

  return (
    <LessonSection>
      <Title2 id={slugify(keyword)}>{keyword}</Title2>
      <Paragraph>{description}</Paragraph>
      <SqlCodeViewer code={query} databaseInitId={databaseInit.id} />
      <div className="mt-4 grid gap-6 md:grid-cols-[312px_1fr] md:items-start">
        <JoinVennDiagram leftLabel="authors" mode={mode} rightLabel="books" />
        <SqlResult execution={execution} />
      </div>
    </LessonSection>
  );
}
