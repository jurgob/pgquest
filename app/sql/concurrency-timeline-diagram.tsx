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

// A vertical band spanning both lanes, marking a window that matters for the
// story: the stale-read window (blue) in the naive group, or the window a row
// stays locked by A while B is blocked (violet) in the other two.
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

const GAP_MID_Y = (LANE_A_Y + LANE_HEIGHT + LANE_B_Y) / 2;

// A short caption sitting in the gap between the two lanes.
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

function NaiveGroup({ patternId }: { patternId: string }) {
  const laneASteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 120 },
    { label: "SELECT (=1)", variant: "read", width: 90, x: 188 },
    { label: "UPDATE (→0)", variant: "neutral", width: 90, x: 286 },
    { label: "INSERT hold", variant: "neutral", width: 90, x: 384 },
    { label: "COMMIT", variant: "commit", width: 70, x: 482 },
  ];
  const laneBSteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 134 },
    { label: "SELECT (=1)", variant: "read", width: 90, x: 202 },
    {
      label: "waiting: row locked by A's UPDATE",
      variant: "blocked",
      width: 182,
      x: 300,
    },
    { label: "UPDATE (→ -1)", variant: "overbook", width: 90, x: 560 },
    { label: "INSERT hold", variant: "overbook", width: 90, x: 658 },
    { label: "COMMIT ✓", variant: "overbook", width: 70, x: 756 },
  ];
  return (
    <g>
      <HatchDefs patternId={patternId} />
      <GroupTitle label="USE seat_available TO CHECK (naive)" />
      {/* Root cause: both reads see the same stale value before either writes. */}
      <HighlightBand fill="#38bdf8" width={104} x={188} />
      <GapLabel className="fill-sky-700 font-bold" text="both read 1 (stale)" x={240} />
      <UnblockMarker x={482} />
      <Lane
        hatchPatternId={patternId}
        label="Transaction A"
        steps={laneASteps}
        y={LANE_A_Y}
      />
      <Lane
        hatchPatternId={patternId}
        label="Transaction B"
        steps={laneBSteps}
        y={LANE_B_Y}
      />
      {/* The overbooking itself: B's writes commit even though A took the seat. */}
      <OverbookedCallout centerX={693} midY={GAP_MID_Y} pointToY={LANE_B_Y - 2} />
    </g>
  );
}

function OverbookedCallout({
  centerX,
  midY,
  pointToY,
}: {
  centerX: number;
  midY: number;
  pointToY: number;
}) {
  return (
    <g>
      <text
        className="fill-red-700 font-bold"
        dominantBaseline="middle"
        fontFamily="monospace"
        fontSize={11}
        textAnchor="middle"
        x={centerX}
        y={midY - 8}
      >
        ⚠ both commit — OVERBOOKED
      </text>
      <text
        className="fill-red-700"
        dominantBaseline="middle"
        fontFamily="monospace"
        fontSize={10}
        textAnchor="middle"
        x={centerX}
        y={midY + 8}
      >
        seat_available = −1 (oversold)
      </text>
      <line
        stroke="#ef4444"
        strokeWidth={1.5}
        x1={centerX}
        x2={centerX}
        y1={midY + 18}
        y2={pointToY - 5}
      />
      <polygon
        fill="#ef4444"
        points={`${centerX - 4},${pointToY - 5} ${centerX + 4},${pointToY - 5} ${centerX},${pointToY + 1}`}
      />
    </g>
  );
}

function SeatLockGroup({ patternId }: { patternId: string }) {
  const laneASteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 120 },
    { label: "SELECT seat FOR UPDATE", variant: "lock-read", width: 150, x: 190 },
    { label: "check: none", variant: "read", width: 100, x: 348 },
    { label: "INSERT hold", variant: "neutral", width: 90, x: 456 },
    { label: "COMMIT", variant: "commit", width: 70, x: 554 },
  ];
  const laneBSteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 134 },
    { label: "blocked, same seat lock", variant: "blocked", width: 352, x: 202 },
    { label: "check: found!", variant: "reject", width: 110, x: 562 },
    { label: "seat taken → reject", variant: "reject", width: 180, x: 680 },
  ];

  return (
    <g>
      <HatchDefs patternId={patternId} />
      <GroupTitle label="INSERT ONLY + FOR UPDATE (primary key, early block)" />
      {/* The seat row stays locked by A from its FOR UPDATE until it commits;
          B is blocked for that whole window. */}
      <HighlightBand fill="#8b5cf6" width={364} x={190} />
      <GapLabel
        className="fill-violet-700 font-bold"
        text="seat row locked by A · B blocked until A commits"
        x={372}
      />
      <UnblockMarker x={554} />
      <Lane
        hatchPatternId={patternId}
        label="Transaction A"
        steps={laneASteps}
        y={LANE_A_Y}
      />
      <Lane
        hatchPatternId={patternId}
        label="Transaction B"
        steps={laneBSteps}
        y={LANE_B_Y}
      />
    </g>
  );
}

function InsertGroup({ patternId }: { patternId: string }) {
  const laneASteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 120 },
    { label: "INSERT (seat 1)", variant: "neutral", width: 160, x: 220 },
    { label: "COMMIT", variant: "commit", width: 90, x: 420 },
  ];
  const laneBSteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 134 },
    { label: "blocked, same PK", variant: "blocked", width: 188, x: 232 },
    { label: "duplicate key error", variant: "reject", width: 220, x: 428 },
  ];

  return (
    <g>
      <HatchDefs patternId={patternId} />
      <GroupTitle label="INSERT ONLY (primary key checks)" />
      {/* A's uncommitted INSERT holds the (event_id, seat_id) key; B's INSERT
          of the same key blocks until A commits. */}
      <HighlightBand fill="#8b5cf6" width={200} x={220} />
      <GapLabel
        className="fill-violet-700 font-bold"
        text="PK locked by A · B blocked until A commits"
        x={320}
      />
      <UnblockMarker x={420} />
      <Lane
        hatchPatternId={patternId}
        label="Transaction A"
        steps={laneASteps}
        y={LANE_A_Y}
      />
      <Lane
        hatchPatternId={patternId}
        label="Transaction B"
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
  const naivePatternId = `hatch-naive-${useId()}`;
  const insertPatternId = `hatch-insert-${useId()}`;
  const seatLockPatternId = `hatch-seat-lock-${useId()}`;
  const secondGroupY = GROUP_HEIGHT + GROUP_GAP;
  const thirdGroupY = secondGroupY * 2;
  const totalHeight = thirdGroupY + GROUP_HEIGHT;

  return (
    <svg
      aria-label="Three timelines comparing seat holding: checking the seat_available counter (overbooks), insert only relying on the primary key, and insert only with an early FOR UPDATE block"
      className="h-auto w-full"
      role="img"
      viewBox={`0 0 900 ${totalHeight}`}
    >
      <g>
        <NaiveGroup patternId={naivePatternId} />
      </g>
      <GroupDivider y={GROUP_HEIGHT + GROUP_GAP / 2} />
      <g transform={`translate(0, ${secondGroupY})`}>
        <InsertGroup patternId={insertPatternId} />
      </g>
      <GroupDivider y={secondGroupY + GROUP_HEIGHT + GROUP_GAP / 2} />
      <g transform={`translate(0, ${thirdGroupY})`}>
        <SeatLockGroup patternId={seatLockPatternId} />
      </g>
    </svg>
  );
}
