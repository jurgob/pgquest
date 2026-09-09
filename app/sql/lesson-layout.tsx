import { SiteHeader } from "./site-header";
import type { LessonId } from "./types";
import { SqlEditor } from "./sql-editor";

export function LessonPage({
  activeLesson,
  children,
  defaultQuery,
  sqlLoad,
  title,
}: {
  activeLesson: LessonId;
  children: React.ReactNode;
  defaultQuery?: string | undefined;
  sqlLoad?: string | undefined;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader activeLesson={activeLesson} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8">
        <article className="flex min-w-0 flex-col gap-6">
          <Title>{title}</Title>
          <div className="flex min-w-0 flex-col gap-6">{children}</div>
          <TryYourself defaultQuery={defaultQuery} sqlLoad={sqlLoad} />
        </article>
      </div>
    </main>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return <section className="min-w-0">{children}</section>;
}

export function LessonSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-6 flex min-w-0 flex-col gap-6 border-t border-zinc-200 pt-8">
      {children}
    </section>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold text-zinc-950">{children}</h1>;
}

export function Title2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-zinc-950">{children}</h2>;
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-base leading-7 text-zinc-800">{children}</p>;
}

export function Paragraphs({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 text-base leading-7 text-zinc-800">{children}</div>;
}

export function TryYourself({
  defaultQuery,
  sqlLoad,
}: {
  defaultQuery?: string | undefined;
  sqlLoad?: string | undefined;
}) {
  if (!sqlLoad || !defaultQuery) {
    return null;
  }

  return (
    <footer className="mt-6">
      <SqlEditor
        className="bg-zinc-50 px-5 py-6"
        description="The database for this lesson is already loaded. Write any query you want and run it directly in your browser."
        initialQuery={defaultQuery}
        sqlLoad={sqlLoad}
        title="Try Yourself"
      />
    </footer>
  );
}
