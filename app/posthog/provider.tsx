import { useEffect, useState } from "react";
import { PostHogProvider as ReactPostHogProvider } from "@posthog/react";
import posthog from "posthog-js";
import { useLocation } from "react-router";

import { internalTrafficQueryParam, type PublicPosthogConfig } from "../config/posthog";

type PgquestPosthogProviderProps = {
  children: React.ReactNode;
  config: PublicPosthogConfig;
};

const internalTrafficStorageKey = "pgquest_internal_traffic";
const feedbackPromptStoragePrefix = "pgquest_feedback_prompted:";

export function PgquestPosthogProvider({
  children,
  config,
}: PgquestPosthogProviderProps) {
  const location = useLocation();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    status: "hidden",
  });

  useEffect(() => {
    if (posthog.__loaded) {
      return;
    }

    const trafficProperties = getTrafficProperties();

    posthog.init(config.projectApiKey, {
      api_host: config.apiHost,
      defaults: "2026-06-25",
      capture_pageview: false,
      disable_session_recording: false,
    });
    registerTrafficProperties(trafficProperties);
    posthog.startSessionRecording();
  }, [config]);

  useEffect(() => {
    if (!posthog.__loaded) {
      return;
    }

    registerTrafficProperties(getTrafficProperties());
    posthog.capture("$pageview");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const pageKey = `${feedbackPromptStoragePrefix}${location.pathname}`;

    if (window.localStorage.getItem(pageKey) === "true") {
      setFeedbackState({ status: "hidden" });
      return;
    }

    setFeedbackState({ status: "hidden" });
    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(pageKey, "true");
      posthog.capture("pgquest_feedback_prompt_shown", {
        path: location.pathname,
      });
      setFeedbackState({ status: "ready" });
    }, 60_000);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <ReactPostHogProvider client={posthog}>
      {children}
      <FeedbackPrompt
        onClose={() => {
          posthog.capture("pgquest_feedback_prompt_dismissed", {
            path: location.pathname,
          });
          setFeedbackState({ status: "hidden" });
        }}
        onOpen={() => setFeedbackState({ status: "open", value: "" })}
        onSubmit={(feedback) => {
          posthog.capture("pgquest_feedback_submitted", {
            feedback,
            path: location.pathname,
          });
          setFeedbackState({ status: "hidden" });
        }}
        state={feedbackState}
      />
    </ReactPostHogProvider>
  );
}

function getTrafficProperties() {
  const isInternalTraffic = getIsInternalTraffic();

  return {
    traffic_type: isInternalTraffic ? "internal" : "external",
    is_internal_traffic: isInternalTraffic,
  };
}

function registerTrafficProperties(properties: ReturnType<typeof getTrafficProperties>) {
  posthog.register(properties);
  posthog.register_for_session(properties);
  posthog.setPersonProperties(properties);
}

function getIsInternalTraffic() {
  if (import.meta.env.DEV || isInternalTrafficQueryParamSet()) {
    window.localStorage.setItem(internalTrafficStorageKey, "true");
    return true;
  }

  return window.localStorage.getItem(internalTrafficStorageKey) === "true";
}

function isInternalTrafficQueryParamSet() {
  return (
    new URLSearchParams(window.location.search).get(internalTrafficQueryParam) === "true"
  );
}

type FeedbackState =
  { status: "hidden" } | { status: "ready" } | { status: "open"; value: string };

function FeedbackPrompt({
  onClose,
  onOpen,
  onSubmit,
  state,
}: {
  onClose: () => void;
  onOpen: () => void;
  onSubmit: (feedback: string) => void;
  state: FeedbackState;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(state.status === "open" ? state.value : "");
  }, [state]);

  if (state.status === "hidden") {
    return null;
  }

  if (state.status === "ready") {
    return (
      <button
        className="fixed bottom-4 right-4 z-50 flex h-11 items-center gap-2 border border-zinc-300 bg-white px-4 font-mono text-sm font-semibold text-zinc-900 shadow-lg transition hover:border-zinc-950 hover:bg-zinc-50"
        onClick={onOpen}
        type="button"
      >
        <span
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-400 text-xs"
        >
          ?
        </span>
        Give feedback
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg border border-zinc-300 bg-white p-4 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-950">How is this page?</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-700">
            Tell us what was useful, confusing, or missing.
          </p>
        </div>
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-300 text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
          onClick={onClose}
          type="button"
        >
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close feedback prompt</span>
        </button>
      </div>
      <textarea
        className="mt-4 min-h-24 w-full resize-y border border-zinc-300 p-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-zinc-950"
        onChange={(event) => setValue(event.target.value)}
        value={value}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button
          className="h-9 border border-zinc-300 px-4 font-mono text-sm text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
          onClick={onClose}
          type="button"
        >
          Skip
        </button>
        <button
          className="h-9 bg-zinc-950 px-4 font-mono text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
          disabled={!value.trim()}
          onClick={() => onSubmit(value.trim())}
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
