import { useId } from "react";

type StepVariant = "blocked" | "commit" | "lock-read" | "neutral" | "read" | "reject";

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

function StaleReadBand({ x, width }: { width: number; x: number }) {
  return (
    <rect
      fill="#38bdf8"
      fillOpacity={0.15}
      height={LANE_B_Y + LANE_HEIGHT - (LANE_A_Y - 4)}
      width={width}
      x={x}
      y={LANE_A_Y - 4}
    />
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
    { label: "UPDATE (→ -1)", variant: "reject", width: 90, x: 560 },
    { label: "INSERT hold", variant: "reject", width: 90, x: 658 },
    { label: "COMMIT", variant: "reject", width: 70, x: 756 },
  ];

  return (
    <g>
      <HatchDefs patternId={patternId} />
      <GroupTitle label="WITHOUT FOR UPDATE" />
      <StaleReadBand width={90} x={202} />
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
      <GroupTitle label="INSERT + FOR UPDATE (EARLY CHECK)" />
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
      <GroupTitle label="INSERT + PRIMARY KEY" />
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
      aria-label="Three timelines comparing seat holding without FOR UPDATE, with INSERT relying on the primary key, and with an early FOR UPDATE check"
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
