export type JoinVennMode = "full" | "inner" | "left" | "right";

const SHADE_COLOR = "#0284c7";
const CX_LEFT = 106;
const CX_RIGHT = 182;
const CY = 74;
const RADIUS = 60;

export function JoinVennDiagram({
  leftLabel,
  mode,
  rightLabel,
}: {
  leftLabel: string;
  mode: JoinVennMode;
  rightLabel: string;
}) {
  const clipId = `join-venn-clip-${mode}-${leftLabel}-${rightLabel}`;

  return (
    <svg
      aria-label={`Venn diagram showing which rows a ${mode} join keeps from ${leftLabel} and ${rightLabel}`}
      className="h-auto w-full max-w-[312px]"
      role="img"
      viewBox="0 0 288 168"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={CX_LEFT} cy={CY} r={RADIUS} />
        </clipPath>
      </defs>

      {mode === "left" || mode === "full" ? (
        <circle cx={CX_LEFT} cy={CY} fill={SHADE_COLOR} fillOpacity={0.22} r={RADIUS} />
      ) : null}
      {mode === "right" || mode === "full" ? (
        <circle cx={CX_RIGHT} cy={CY} fill={SHADE_COLOR} fillOpacity={0.22} r={RADIUS} />
      ) : null}
      {mode === "inner" ? (
        <g clipPath={`url(#${clipId})`}>
          <circle cx={CX_RIGHT} cy={CY} fill={SHADE_COLOR} fillOpacity={0.4} r={RADIUS} />
        </g>
      ) : null}

      <circle
        cx={CX_LEFT}
        cy={CY}
        fill="none"
        r={RADIUS}
        stroke="#52525b"
        strokeWidth={1.5}
      />
      <circle
        cx={CX_RIGHT}
        cy={CY}
        fill="none"
        r={RADIUS}
        stroke="#52525b"
        strokeWidth={1.5}
      />

      <text
        className="fill-zinc-600"
        fontFamily="monospace"
        fontSize={10}
        textAnchor="middle"
        x={CX_LEFT}
        y={CY + RADIUS + 16}
      >
        {leftLabel}
      </text>
      <text
        className="fill-zinc-600"
        fontFamily="monospace"
        fontSize={10}
        textAnchor="middle"
        x={CX_RIGHT}
        y={CY + RADIUS + 16}
      >
        {rightLabel}
      </text>
    </svg>
  );
}

const CROSS_CX_LEFT = 76;
const CROSS_CX_RIGHT = 224;
const CROSS_CY = 76;
const CROSS_RADIUS = 52;
const CROSS_DOT_SPREAD = 34;

function dotPositions(count: number) {
  if (count <= 1) {
    return [CROSS_CY];
  }

  const step = (CROSS_DOT_SPREAD * 2) / (count - 1);
  return Array.from(
    { length: count },
    (_, index) => CROSS_CY - CROSS_DOT_SPREAD + index * step,
  );
}

export function CrossJoinDiagram({
  leftCount,
  leftLabel,
  rightCount,
  rightLabel,
}: {
  leftCount: number;
  leftLabel: string;
  rightCount: number;
  rightLabel: string;
}) {
  const leftDots = dotPositions(leftCount);
  const rightDots = dotPositions(rightCount);

  return (
    <svg
      aria-label={`Diagram showing every ${leftLabel} row paired with every ${rightLabel} row`}
      className="h-auto w-full max-w-[300px]"
      role="img"
      viewBox="0 0 300 170"
    >
      {leftDots.map((leftY, leftIndex) =>
        rightDots.map((rightY, rightIndex) => (
          <line
            key={`${leftIndex}-${rightIndex}`}
            stroke={SHADE_COLOR}
            strokeOpacity={0.45}
            strokeWidth={1}
            x1={CROSS_CX_LEFT}
            x2={CROSS_CX_RIGHT}
            y1={leftY}
            y2={rightY}
          />
        )),
      )}

      <circle
        cx={CROSS_CX_LEFT}
        cy={CROSS_CY}
        fill="none"
        r={CROSS_RADIUS}
        stroke="#52525b"
        strokeWidth={1.5}
      />
      <circle
        cx={CROSS_CX_RIGHT}
        cy={CROSS_CY}
        fill="none"
        r={CROSS_RADIUS}
        stroke="#52525b"
        strokeWidth={1.5}
      />

      {leftDots.map((leftY, index) => (
        <circle cx={CROSS_CX_LEFT} cy={leftY} fill={SHADE_COLOR} key={index} r={3.5} />
      ))}
      {rightDots.map((rightY, index) => (
        <circle cx={CROSS_CX_RIGHT} cy={rightY} fill={SHADE_COLOR} key={index} r={3.5} />
      ))}

      <text
        className="fill-zinc-600"
        fontFamily="monospace"
        fontSize={10}
        textAnchor="middle"
        x={CROSS_CX_LEFT}
        y={CROSS_CY + CROSS_RADIUS + 18}
      >
        {leftLabel}
      </text>
      <text
        className="fill-zinc-600"
        fontFamily="monospace"
        fontSize={10}
        textAnchor="middle"
        x={CROSS_CX_RIGHT}
        y={CROSS_CY + CROSS_RADIUS + 18}
      >
        {rightLabel}
      </text>
    </svg>
  );
}
