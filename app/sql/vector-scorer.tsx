import { useState } from "react";
import { SCORING_MODEL } from "../../cli_examples/search-documents";

// SCORING_MODEL is a small zero-shot classifier that runs in the browser through
// ONNX. It scores a text against each label; the scores sum to 1. The search
// lessons' stored vectors were produced with this same form.

// The three dimensions of the search lessons' vectors, in order, with the label
// the model is given for each.
const DIMENSIONS = [
  { name: "databases", label: "databases" },
  { name: "web", label: "web development" },
  { name: "AI", label: "artificial intelligence" },
] as const;

type ZeroShotOutput = { labels: string[]; scores: number[] };
type Classifier = (text: string, labels: string[]) => Promise<ZeroShotOutput>;

// Loaded on first use only, so the page never downloads the library or the model
// unless someone actually scores a text.
let classifierPromise: Promise<Classifier> | undefined;

function loadClassifier(): Promise<Classifier> {
  classifierPromise ??= import("@huggingface/transformers")
    .then(
      async ({ pipeline }) =>
        (await pipeline(
          "zero-shot-classification",
          SCORING_MODEL,
        )) as unknown as Classifier,
    )
    .catch((error: unknown) => {
      classifierPromise = undefined;
      throw error;
    });
  return classifierPromise;
}

async function scoreText(text: string): Promise<readonly number[]> {
  const classifier = await loadClassifier();
  const output = await classifier(
    text,
    DIMENSIONS.map((dimension) => dimension.label),
  );
  // The output is sorted by score; put it back in [databases, web, AI] order.
  return DIMENSIONS.map(
    (dimension) => output.scores[output.labels.indexOf(dimension.label)] ?? 0,
  );
}

// "mobilebert-uncased-mnli", linking to the model's Hugging Face page.
export function ScoringModelLink() {
  return (
    <a
      className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
      href={`https://huggingface.co/${SCORING_MODEL}`}
      rel="noreferrer"
      target="_blank"
    >
      {SCORING_MODEL.split("/")[1]}
    </a>
  );
}

export function formatVector(scores: readonly number[]) {
  return `[${scores.map((score) => score.toFixed(2)).join(", ")}]`;
}

type ScorerState =
  | { status: "idle" }
  | { status: "scoring" }
  | { status: "done"; scores: readonly number[]; text: string }
  | { message: string; status: "error" };

export function VectorScorer() {
  const [text, setText] = useState("speed up my database");
  const [state, setState] = useState<ScorerState>({ status: "idle" });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed === "") {
      return;
    }
    setState({ status: "scoring" });
    try {
      setState({ scores: await scoreText(trimmed), status: "done", text: trimmed });
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : String(error),
        status: "error",
      });
    }
  };

  return (
    <form className="border border-zinc-200 p-4" onSubmit={submit}>
      <label
        className="font-mono text-sm font-semibold text-zinc-950"
        htmlFor="score-text"
      >
        Score your text for [databases, web, AI]
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          className="min-w-0 flex-1 border border-zinc-300 px-3 py-2 text-base text-zinc-950 outline-none transition focus:border-zinc-950"
          id="score-text"
          onChange={(event) => setText(event.target.value)}
          value={text}
        />
        <button
          className="w-fit bg-zinc-950 px-6 py-2 font-mono text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
          disabled={state.status === "scoring" || text.trim() === ""}
          type="submit"
        >
          Score
        </button>
      </div>
      <div className="mt-3 min-h-7 font-mono text-sm text-zinc-800" aria-live="polite">
        {state.status === "scoring" ? (
          <span className="text-zinc-500">
            Scoring… the first time downloads the model, which takes a moment.
          </span>
        ) : null}
        {state.status === "done" ? (
          <span>
            &apos;{state.text}&apos; is{" "}
            <span className="font-semibold text-zinc-950">
              &apos;{formatVector(state.scores)}&apos;
            </span>
          </span>
        ) : null}
        {state.status === "error" ? (
          <span className="text-red-700">
            Couldn&apos;t score the text: {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
