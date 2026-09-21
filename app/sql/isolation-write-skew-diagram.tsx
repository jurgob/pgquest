type StepVariant = "commit" | "neutral" | "read" | "reject";

type Step = {
  label: string;
  variant: StepVariant;
  width: number;
  x: number;
};

const VARIANT_STYLES: Record<
  StepVariant,
  { fill: string; stroke: string; textClass: string }
> = {
  commit: { fill: "#d1fae5", stroke: "#10b981", textClass: "fill-emerald-800" },
  neutral: { fill: "#f4f4f5", stroke: "#a1a1aa", textClass: "fill-zinc-700" },
  read: { fill: "#e0f2fe", stroke: "#38bdf8", textClass: "fill-sky-800" },
  reject: { fill: "#fee2e2", stroke: "#ef4444", textClass: "fill-red-800 font-bold" },
};

const VIEWBOX_WIDTH = 1000;
const LANE_HEIGHT = 40;
const LANE_GAP = 18;
const LANE_A_Y = 54;
const LANE_B_Y = LANE_A_Y + LANE_HEIGHT + LANE_GAP;
const GROUP_HEIGHT = 180;
const GROUP_GAP = 24;
const ICON_CX = VIEWBOX_WIDTH - 50;
const ICON_CY = (LANE_A_Y + LANE_B_Y + LANE_HEIGHT) / 2;
const ICON_RADIUS = 30;

function Lane({ label, steps, y }: { label: string; steps: Step[]; y: number }) {
  return (
    <g>
      <text
        className="fill-zinc-600 font-bold"
        dominantBaseline="middle"
        fontFamily="monospace"
        fontSize={11}
        x={4}
        y={y + LANE_HEIGHT / 2}
      >
        {label}
      </text>
      {steps.map((step, index) => {
        const style = VARIANT_STYLES[step.variant];
        return (
          <g key={index}>
            <rect
              fill={style.fill}
              height={LANE_HEIGHT}
              rx={5}
              stroke={style.stroke}
              strokeWidth={1.5}
              width={step.width}
              x={step.x}
              y={y}
            />
            <text
              className={style.textClass}
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

// A vertical band spanning both lanes: the window where both sessions have
// already read the "someone else is on call" check.
function HighlightBand({ x, width }: { width: number; x: number }) {
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
      y={14}
    >
      {label}
    </text>
  );
}

function OutcomeLine({
  icon,
  text,
  tone,
}: {
  icon: string;
  text: string;
  tone: "danger" | "safe";
}) {
  return (
    <text
      className={
        tone === "danger" ? "fill-red-700 font-bold" : "fill-emerald-700 font-bold"
      }
      dominantBaseline="middle"
      fontFamily="monospace"
      x={0}
      y={34}
    >
      <tspan fontSize={22}>{icon}</tspan>
      <tspan dx={8} fontSize={11.5}>
        {text}
      </tspan>
    </text>
  );
}

function OutcomeIcon({ tone }: { tone: "danger" | "safe" }) {
  if (tone === "danger") {
    return (
      <g>
        <circle
          cx={ICON_CX}
          cy={ICON_CY}
          fill="#fee2e2"
          r={ICON_RADIUS}
          stroke="#ef4444"
          strokeWidth={3}
        />
        <path
          d={`M ${ICON_CX - 13} ${ICON_CY - 13} L ${ICON_CX + 13} ${ICON_CY + 13} M ${ICON_CX + 13} ${ICON_CY - 13} L ${ICON_CX - 13} ${ICON_CY + 13}`}
          stroke="#ef4444"
          strokeLinecap="round"
          strokeWidth={5.5}
        />
      </g>
    );
  }

  return (
    <g>
      <circle
        cx={ICON_CX}
        cy={ICON_CY}
        fill="#d1fae5"
        r={ICON_RADIUS}
        stroke="#10b981"
        strokeWidth={3}
      />
      <path
        d={`M ${ICON_CX - 14} ${ICON_CY} L ${ICON_CX - 3} ${ICON_CY + 12} L ${ICON_CX + 15} ${ICON_CY - 13}`}
        fill="none"
        stroke="#10b981"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={5.5}
      />
    </g>
  );
}

// REPEATABLE READ (also READ UNCOMMITTED / READ COMMITTED): both checks
// pass, both commits succeed, and the "at least one on call" rule breaks.
function BothSucceedGroup() {
  const aliceSteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 120 },
    { label: "Step 1: Check", variant: "read", width: 120, x: 190 },
    { label: "Step 2: Update", variant: "neutral", width: 150, x: 320 },
    { label: "COMMIT", variant: "commit", width: 80, x: 480 },
  ];
  const bobSteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 134 },
    { label: "Step 1: Check", variant: "read", width: 120, x: 204 },
    { label: "Step 2: Update", variant: "neutral", width: 150, x: 560 },
    { label: "COMMIT", variant: "commit", width: 80, x: 720 },
  ];

  return (
    <g>
      <GroupTitle label="READ UNCOMMITTED · READ COMMITTED · REPEATABLE READ" />
      <OutcomeLine
        icon="⚠"
        text="both commits succeed — on_call count = 0"
        tone="danger"
      />
      {/* Both read "1 other on call" before either commits its update. */}
      <HighlightBand width={134} x={190} />
      <OutcomeIcon tone="danger" />
      <Lane label="Alice" steps={aliceSteps} y={LANE_A_Y} />
      <Lane label="Bob" steps={bobSteps} y={LANE_B_Y} />
    </g>
  );
}

// SERIALIZABLE: the same two scripts, but Postgres detects the read/write
// conflict and rejects the second commit instead of letting it through.
function OneRejectedGroup() {
  const aliceSteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 120 },
    { label: "Step 1: Check", variant: "read", width: 120, x: 190 },
    { label: "Step 2: Update", variant: "neutral", width: 150, x: 320 },
    { label: "COMMIT", variant: "commit", width: 80, x: 480 },
  ];
  const bobSteps: Step[] = [
    { label: "BEGIN", variant: "neutral", width: 60, x: 134 },
    { label: "Step 1: Check", variant: "read", width: 120, x: 204 },
    { label: "Step 2: Update", variant: "neutral", width: 150, x: 560 },
    { label: "COMMIT — rejected (40001)", variant: "reject", width: 170, x: 720 },
  ];

  return (
    <g>
      <GroupTitle label="SERIALIZABLE" />
      <OutcomeLine
        icon="✓"
        text="Bob's commit is rejected — on_call count stays 1"
        tone="safe"
      />
      <HighlightBand width={134} x={190} />
      <OutcomeIcon tone="safe" />
      <Lane label="Alice" steps={aliceSteps} y={LANE_A_Y} />
      <Lane label="Bob" steps={bobSteps} y={LANE_B_Y} />
    </g>
  );
}

function GroupDivider({ y }: { y: number }) {
  return (
    <line stroke="#e4e4e7" strokeWidth={1} x1={0} x2={VIEWBOX_WIDTH} y1={y} y2={y} />
  );
}

export function IsolationWriteSkewDiagram() {
  const secondGroupY = GROUP_HEIGHT + GROUP_GAP;
  const totalHeight = secondGroupY + GROUP_HEIGHT;

  return (
    <svg
      aria-label="Two timelines of the same on-call check-then-act race: under READ UNCOMMITTED, READ COMMITTED, or REPEATABLE READ both Alice and Bob successfully take themselves off call, leaving nobody on call; under SERIALIZABLE, Bob's commit is rejected and at least one engineer stays on call"
      className="h-auto w-full"
      role="img"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${totalHeight}`}
    >
      <g>
        <BothSucceedGroup />
      </g>
      <GroupDivider y={GROUP_HEIGHT + GROUP_GAP / 2} />
      <g transform={`translate(0, ${secondGroupY})`}>
        <OneRejectedGroup />
      </g>
    </svg>
  );
}
