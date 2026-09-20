import { useState } from "react";
import posthog from "posthog-js";
import type { Route } from "./+types/feedback";
import { SiteHeader } from "../sql/site-header";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Feedback" },
    {
      name: "description",
      content: "Send feedback, report a bug, or ask about training.",
    },
  ];
}

type SubmitState = "idle" | "sent";

export default function Feedback() {
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  const canSubmit = feedback.trim().length > 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <header className="border-b border-zinc-200 pb-12">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-950">Feedback</h1>
          <p className="mt-6 text-xl leading-9 text-zinc-700">
            Found a bug? Have a suggestion? Or interested in running a PostgreSQL course
            for your company? Write it below.
          </p>
        </header>

        <section className="pt-10">
          {state === "sent" ? (
            <div className="border border-emerald-200 bg-emerald-50 p-6">
              <p className="font-mono text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Sent
              </p>
              <p className="mt-2 text-xl leading-8 text-zinc-800">
                Thanks, this was received. If you left an email, expect a reply there.
              </p>
              <button
                className="mt-4 border border-zinc-300 px-4 py-2 font-mono text-sm text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
                onClick={() => {
                  setFeedback("");
                  setEmail("");
                  setState("idle");
                }}
                type="button"
              >
                Send another
              </button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault();

                if (!canSubmit) {
                  return;
                }

                posthog.capture("pgquest_feedback_submitted", {
                  email: email.trim() || undefined,
                  feedback: feedback.trim(),
                  path: "/feedback",
                  source: "feedback_page",
                });
                setState("sent");
              }}
            >
              <div>
                <label
                  className="font-mono text-sm font-semibold uppercase tracking-wide text-zinc-700"
                  htmlFor="feedback"
                >
                  Feedback
                </label>
                <textarea
                  autoFocus
                  className="mt-2 min-h-40 w-full resize-y border border-zinc-300 p-4 text-base leading-7 text-zinc-950 outline-none transition focus:border-zinc-950"
                  id="feedback"
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Bugs, suggestions, missing lessons, or “we'd like a PostgreSQL course for our team”…"
                  value={feedback}
                />
              </div>

              <div>
                <label
                  className="font-mono text-sm font-semibold uppercase tracking-wide text-zinc-700"
                  htmlFor="email"
                >
                  Email (optional)
                </label>
                <p className="mt-1 text-sm text-zinc-500">
                  Only needed if you want a reply, e.g. about a company course.
                </p>
                <input
                  className="mt-2 w-full max-w-sm border border-zinc-300 px-4 py-2 text-base text-zinc-950 outline-none transition focus:border-zinc-950"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  type="email"
                  value={email}
                />
              </div>

              <button
                className="w-fit bg-zinc-950 px-6 py-3 font-mono text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
                disabled={!canSubmit}
                type="submit"
              >
                Send
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
