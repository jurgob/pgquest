import {
  isRouteErrorResponse,
  Links,
  Link,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ExerciseProgressProvider } from "./sql/exercise-progress-context";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ExerciseProgressProvider>
      <Outlet />
    </ExerciseProgressProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="bg-[#222222] text-white">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-4">
          <Link className="flex w-fit items-center text-white no-underline" to="/">
            <span className="text-3xl font-bold">PgQuest</span>
          </Link>
          <img
            alt=""
            className="pointer-events-none absolute right-5 top-1/2 h-20 w-20 -translate-y-1/2"
            src="/favicon.svg"
          />
          <nav className="flex items-center gap-2 text-sm text-zinc-300">
            <Link
              className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-zinc-500 text-white no-underline transition hover:border-white hover:bg-white hover:text-zinc-950"
              title="Home"
              to="/"
            >
              <HomeIcon />
            </Link>
            <span>{isNotFound ? "Page not found" : "Something went wrong"}</span>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-112px)] w-full max-w-4xl items-center justify-center px-5 py-16 text-center">
        <section>
          <p className="font-mono text-xl font-semibold uppercase tracking-wide text-sky-700">
            {message}
          </p>
          <h1 className="mt-5 text-6xl font-bold tracking-tight text-zinc-950 sm:text-7xl">
            {isNotFound ? "This page is not in the quest log" : "The page crashed"}
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-3xl font-semibold leading-[3rem] text-zinc-700">
            {details}{" "}
            <Link
              className="text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
              to="/"
            >
              Go back to the home page
            </Link>
            .
          </p>
        </section>
      </div>

      {stack && (
        <pre className="mx-auto mb-12 w-full max-w-6xl overflow-x-auto bg-zinc-950 p-4 text-sm text-zinc-100">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
