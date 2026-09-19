import { useId } from "react";

type StepVariant =
  "blocked" | "commit" | "lock-read" | "neutral" | "overbook" | "read" | "reject";

type Step = {
  label: string;
  variant: StepVariant;
  width: number;
  x: number;
};

const VARIANT_STYLES: Record<
  Exclude<StepVariant, "blocked">,
  { fill: string; stroke: string; textClass: string }
> = {
  commit: { fill: "#d1fae5", stroke: "#10b981", textClass: "fill-emerald-800" },
  "lock-read": {
    fill: "#bae6fd",
    stroke: "#0284c7",
    textClass: "fill-sky-900 font-bold",
  },
  neutral: { fill: "#f4f4f5", stroke: "#a1a1aa", textClass: "fill-zinc-700" },
  overbook: { fill: "#fef3c7", stroke: "#f59e0b", textClass: "fill-amber-800 font-bold" },
  read: { fill: "#e0f2fe", stroke: "#38bdf8", textClass: "fill-sky-800" },
  reject: { fill: "#fee2e2", stroke: "#ef4444", textClass: "fill-red-800 font-bold" },
};

const LANE_HEIGHT = 40;
const LANE_A_Y = 60;
const LANE_B_Y = 184;
const GROUP_HEIGHT = 230;
const GROUP_GAP = 30;
const GAP_MID_Y = (LANE_A_Y + LANE_HEIGHT + LANE_B_Y) / 2;

function Lane({
  hatchPatternId,
  label,
  steps,
  y,
}: {
  hatchPatternId: string;
  label: string;
  steps: Step[];
  y: number;
}) {
  return (
    <g>
      <text
        className="fill-zinc-500"
        fontFamily="monospace"
        fontSize={11}
        x={0}
        y={y - 10}
      >
        {label}
      </text>
      {steps.map((step, index) => {
        const isBlocked = step.variant === "blocked";
        const style = step.variant === "blocked" ? null : VARIANT_STYLES[step.variant];
        return (
          <g key={index}>
            <rect
              fill={isBlocked ? `url(#${hatchPatternId})` : style!.fill}
              height={LANE_HEIGHT}
              rx={5}
              stroke={isBlocked ? "#ef4444" : style!.stroke}
              strokeWidth={1.5}
              width={step.width}
              x={step.x}
              y={y}
            />
            <text
              className={isBlocked ? "fill-red-700 font-bold" : style!.textClass}
              dominantBaseline="middle"
              fontFamily="monospace"
              fontSize={10.5}
              textAnchor="middle"
              x={step.x + step.width / 2}
              y={y + LANE_HEIGHT / 2 + 1}
            >
              {step.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function HatchDefs({ patternId }: { patternId: string }) {
  return (
    <defs>
      <pattern
        height={8}
        id={patternId}
        patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse"
        width={8}
      >
        <rect fill="#fee2e2" height={8} width={8} />
        <line stroke="#ef4444" strokeWidth={2} x1={0} x2={0} y1={0} y2={8} />
      </pattern>
    </defs>
  );
}

function UnblockMarker({ x }: { x: number }) {
  return (
    <line
      stroke="#a1a1aa"
      strokeDasharray="3 3"
      strokeWidth={1}
      x1={x}
      x2={x}
      y1={LANE_A_Y - 4}
      y2={LANE_B_Y + LANE_HEIGHT + 4}
    />
  );
}

// A vertical band spanning both lanes: the stale-read window (blue) or the
// window a row stays locked by A while B is blocked (violet).
function HighlightBand({ x, width, fill }: { fill: string; width: number; x: number }) {
  return (
    <rect
      fill={fill}
      fillOpacity={0.15}
      height={LANE_B_Y + LANE_HEIGHT - (LANE_A_Y - 4)}
      width={width}
      x={x}
      y={LANE_A_Y - 4}
    />
  );
}

function GapLabel({
  className,
  text,
  x,
}: {
  className: string;
  text: string;
  x: number;
}) {
  return (
    <text
      className={className}
      dominantBaseline="middle"
      fontFamily="monospace"
      fontSize={9.5}
      textAnchor="middle"
      x={x}
      y={GAP_MID_Y}
    >
      {text}
    </text>
  );
}

function GroupTitle({ label }: { label: string }) {
  return (
    <text
      className="fill-zinc-900 font-bold"
      fontFamily="monospace"
      fontSize={14}
      x={0}
      y={16}
    >
      {label}
    </text>
  );
}

// Two lines of red warning text in the gap, with an arrow down into lane B.
function LimitBrokenCallout({ centerX }: { centerX: number }) {
  const pointToY = LANE_B_Y - 2;
  return (
    <g>
      <text
        className="fill-red-700 font-bold"
        dominantBaseline="middle"
        fontFamily="monospace"
        fontSize={11}
        textAnchor="middle"
        x={centerX}
        y={GAP_MID_Y - 8}
      >
        ⚠ both passed the check
      </text>
      <text
        className="fill-red-700"
        dominantBaseline="middle"
        fontFamily="monospace"
        fontSize={10}
        textAnchor="middle"
        x={centerX}
        y={GAP_MID_Y + 8}
      >
        user now holds 2 &gt; limit 1
      </text>
      <line
        stroke="#ef4444"
        strokeWidth={1.5}
        x1={centerX}
        x2={centerX}
        y1={GAP_MID_Y + 18}
        y2={pointToY - 5}
      />
      <polygon
        fill="#ef4444"
        points={`${centerX - 4},${pointToY - 5} ${centerX + 4},${pointToY - 5} ${centerX},${pointToY + 1}`}
      />
    </g>
  );
}

// Two concurrent hold requests from the SAME user, limit = 1, no lock.
function NoLockGroup({ patternId }: { patternId: string }) {
  const laneASteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 120 },
    { label: "SELECT count (=0)", variant: "read", width: 120, x: 190 },
    { label: "INSERT hold A2", variant: "neutral", width: 120, x: 320 },
    { label: "COMMIT", variant: "commit", width: 70, x: 450 },
  ];
  const laneBSteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 134 },
    { label: "SELECT count (=0)", variant: "read", width: 120, x: 204 },
    { label: "INSERT hold A3", variant: "overbook", width: 120, x: 560 },
    { label: "COMMIT", variant: "overbook", width: 70, x: 690 },
  ];

  return (
    <g>
      <HatchDefs patternId={patternId} />
      <GroupTitle label="PER-USER LIMIT WITHOUT FOR UPDATE" />
      {/* Both read the count before either commits its INSERT. */}
      <HighlightBand fill="#38bdf8" width={134} x={190} />
      <GapLabel className="fill-sky-700 font-bold" text="both count 0 (stale)" x={257} />
      <Lane
        hatchPatternId={patternId}
        label="Hold request 1"
        steps={laneASteps}
        y={LANE_A_Y}
      />
      <Lane
        hatchPatternId={patternId}
        label="Hold request 2 (same user)"
        steps={laneBSteps}
        y={LANE_B_Y}
      />
      <LimitBrokenCallout centerX={655} />
    </g>
  );
}

// Same two requests, but the user row is locked first with FOR UPDATE.
function WithLockGroup({ patternId }: { patternId: string }) {
  const laneASteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 120 },
    { label: "SELECT user FOR UPDATE", variant: "lock-read", width: 150, x: 190 },
    { label: "SELECT count (=0)", variant: "read", width: 110, x: 348 },
    { label: "INSERT hold", variant: "neutral", width: 90, x: 466 },
    { label: "COMMIT", variant: "commit", width: 70, x: 564 },
  ];
  const laneBSteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 134 },
    { label: "blocked, user row locked", variant: "blocked", width: 362, x: 202 },
    { label: "SELECT count (=1)", variant: "read", width: 110, x: 572 },
    { label: "reject: at limit", variant: "reject", width: 170, x: 690 },
  ];

  return (
    <g>
      <HatchDefs patternId={patternId} />
      <GroupTitle label="PER-USER LIMIT WITH FOR UPDATE" />
      {/* The user row stays locked by A from its FOR UPDATE until it commits. */}
      <HighlightBand fill="#8b5cf6" width={374} x={190} />
      <GapLabel
        className="fill-violet-700 font-bold"
        text="user row locked by A · B blocked until A commits"
        x={377}
      />
      <UnblockMarker x={564} />
      <Lane
        hatchPatternId={patternId}
        label="Hold request 1"
        steps={laneASteps}
        y={LANE_A_Y}
      />
      <Lane
        hatchPatternId={patternId}
        label="Hold request 2 (same user)"
        steps={laneBSteps}
        y={LANE_B_Y}
      />
    </g>
  );
}

function GroupDivider({ y }: { y: number }) {
  return <line stroke="#e4e4e7" strokeWidth={1} x1={0} x2={900} y1={y} y2={y} />;
}

export function ConcurrencyComparisonDiagram() {
  const noLockPatternId = `hatch-nolock-${useId()}`;
  const withLockPatternId = `hatch-withlock-${useId()}`;
  const secondGroupY = GROUP_HEIGHT + GROUP_GAP;
  const totalHeight = secondGroupY + GROUP_HEIGHT;

  return (
    <svg
      aria-label="Two timelines of a per-user hold limit: without FOR UPDATE both concurrent requests read a stale count and exceed the limit; with FOR UPDATE the second request blocks, then sees the real count and is rejected"
      className="h-auto w-full"
      role="img"
      viewBox={`0 0 900 ${totalHeight}`}
    >
      <g>
        <NoLockGroup patternId={noLockPatternId} />
      </g>
      <GroupDivider y={GROUP_HEIGHT + GROUP_GAP / 2} />
      <g transform={`translate(0, ${secondGroupY})`}>
        <WithLockGroup patternId={withLockPatternId} />
      </g>
    </svg>
  );
}
