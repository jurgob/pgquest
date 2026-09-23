const ZINC_STROKE = "#a1a1aa";
const DEAD_FILL = "#f4f4f5";
const LIVE_FILL = "#ecfdf5";
const LIVE_STROKE = "#10b981";
const INDEX_FILL = "#f0f9ff";
const INDEX_STROKE = "#0284c7";

function Title({ label, x }: { label: string; x: number }) {
  return (
    <text
      className="fill-zinc-900 font-bold"
      fontFamily="monospace"
      fontSize={13}
      textAnchor="middle"
      x={x}
      y={16}
    >
      {label}
    </text>
  );
}

function Outcome({
  icon,
  text,
  tone,
  x,
}: {
  icon: string;
  text: string;
  tone: "safe" | "warn";
  x: number;
}) {
  return (
    <text
      className={
        tone === "safe" ? "fill-emerald-700 font-bold" : "fill-amber-700 font-bold"
      }
      dominantBaseline="middle"
      fontFamily="monospace"
      textAnchor="middle"
      x={x}
      y={40}
    >
      <tspan fontSize={16}>{icon}</tspan>
      <tspan dx={6} fontSize={10.5}>
        {text}
      </tspan>
    </text>
  );
}

function IndexBox({ x }: { x: number }) {
  return (
    <g>
      <rect
        fill={INDEX_FILL}
        height={24}
        rx={4}
        stroke={INDEX_STROKE}
        strokeWidth={1.5}
        width={80}
        x={x - 40}
        y={54}
      />
      <text
        className="fill-sky-800"
        dominantBaseline="middle"
        fontFamily="monospace"
        fontSize={10}
        textAnchor="middle"
        x={x}
        y={67}
      >
        email idx
      </text>
    </g>
  );
}

function DeadTuple({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect
        fill={DEAD_FILL}
        height={50}
        rx={4}
        stroke={ZINC_STROKE}
        strokeDasharray="4 3"
        strokeWidth={1.5}
        width={100}
        x={x - 50}
        y={y}
      />
      <text
        className="fill-zinc-500"
        fontFamily="monospace"
        fontSize={10}
        textAnchor="middle"
        x={x}
        y={y + 22}
      >
        old row
      </text>
      <text
        className="fill-zinc-400"
        fontFamily="monospace"
        fontSize={9}
        textAnchor="middle"
        x={x}
        y={y + 37}
      >
        (dead)
      </text>
    </g>
  );
}

function LiveTuple({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect
        fill={LIVE_FILL}
        height={50}
        rx={4}
        stroke={LIVE_STROKE}
        strokeWidth={1.5}
        width={100}
        x={x - 50}
        y={y}
      />
      <text
        className="fill-emerald-800 font-bold"
        fontFamily="monospace"
        fontSize={10}
        textAnchor="middle"
        x={x}
        y={y + 22}
      >
        new row
      </text>
      <text
        className="fill-emerald-700"
        fontFamily="monospace"
        fontSize={9}
        textAnchor="middle"
        x={x}
        y={y + 37}
      >
        (live)
      </text>
    </g>
  );
}

function PageBox({
  height,
  label,
  width,
  x,
  y,
}: {
  height: number;
  label: string;
  width: number;
  x: number;
  y: number;
}) {
  return (
    <g>
      <rect
        fill="none"
        height={height}
        rx={6}
        stroke="#d4d4d8"
        strokeWidth={1.5}
        width={width}
        x={x}
        y={y}
      />
      <text
        className="fill-zinc-400"
        fontFamily="monospace"
        fontSize={9}
        x={x + 8}
        y={y + 14}
      >
        {label}
      </text>
    </g>
  );
}

export function HotUpdateDiagram() {
  return (
    <svg
      aria-label="Diagram comparing a HOT update, which reuses the same page and leaves the index untouched, with DELETE + INSERT, which writes a new page and touches the index twice"
      className="h-auto w-full max-w-[640px]"
      role="img"
      viewBox="0 0 640 264"
    >
      <defs>
        <marker
          id="hot-arrow-live"
          markerHeight={7}
          markerWidth={7}
          orient="auto-start-reverse"
          refX={6}
          refY={3.5}
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill={LIVE_STROKE} />
        </marker>
        <marker
          id="hot-arrow-dead"
          markerHeight={7}
          markerWidth={7}
          orient="auto-start-reverse"
          refX={6}
          refY={3.5}
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill={ZINC_STROKE} />
        </marker>
      </defs>

      <line stroke="#e4e4e7" strokeWidth={1} x1={320} x2={320} y1={10} y2={220} />

      {/* UPDATE (HOT) */}
      <Title label="UPDATE (HOT)" x={150} />
      <Outcome icon="✓" text="same page, index untouched" tone="safe" x={150} />
      <IndexBox x={150} />
      <line
        markerEnd="url(#hot-arrow-live)"
        stroke="#52525b"
        strokeWidth={1.5}
        x1={150}
        x2={150}
        y1={78}
        y2={108}
      />
      <PageBox height={92} label="page 3" width={260} x={20} y={110} />
      <DeadTuple x={90} y={134} />
      <LiveTuple x={210} y={134} />
      <line
        markerEnd="url(#hot-arrow-live)"
        stroke={LIVE_STROKE}
        strokeWidth={1.5}
        x1={141}
        x2={159}
        y1={159}
        y2={159}
      />
      <text
        className="fill-zinc-500"
        fontFamily="monospace"
        fontSize={9.5}
        textAnchor="middle"
        x={150}
        y={216}
      >
        no other index has to change
      </text>

      {/* DELETE + INSERT */}
      <Title label="DELETE + INSERT" x={490} />
      <Outcome icon="⚠" text="new page, index touched twice" tone="warn" x={490} />
      <IndexBox x={490} />
      <line
        markerEnd="url(#hot-arrow-dead)"
        stroke={ZINC_STROKE}
        strokeDasharray="4 3"
        strokeWidth={1.5}
        x1={478}
        x2={410}
        y1={80}
        y2={108}
      />
      <line
        markerEnd="url(#hot-arrow-live)"
        stroke={LIVE_STROKE}
        strokeWidth={1.5}
        x1={502}
        x2={570}
        y1={80}
        y2={108}
      />
      <PageBox height={92} label="page 3" width={110} x={340} y={110} />
      <DeadTuple x={395} y={134} />
      <PageBox height={92} label="page 9" width={110} x={470} y={110} />
      <LiveTuple x={525} y={134} />
      <text
        className="fill-zinc-400"
        fontFamily="monospace"
        fontSize={9}
        textAnchor="middle"
        x={410}
        y={94}
      >
        removed
      </text>
      <text
        className="fill-emerald-700"
        fontFamily="monospace"
        fontSize={9}
        textAnchor="middle"
        x={570}
        y={94}
      >
        added
      </text>
      <text
        className="fill-zinc-500"
        fontFamily="monospace"
        fontSize={9.5}
        textAnchor="middle"
        x={490}
        y={216}
      >
        old entry dropped, new entry added
      </text>

      {/* Legend */}
      <rect
        fill={LIVE_FILL}
        height={12}
        rx={2}
        stroke={LIVE_STROKE}
        width={16}
        x={190}
        y={242}
      />
      <text
        className="fill-zinc-600"
        fontFamily="monospace"
        fontSize={9.5}
        x={210}
        y={251}
      >
        live tuple
      </text>
      <rect
        fill={DEAD_FILL}
        height={12}
        rx={2}
        stroke={ZINC_STROKE}
        strokeDasharray="3 2"
        width={16}
        x={330}
        y={242}
      />
      <text
        className="fill-zinc-600"
        fontFamily="monospace"
        fontSize={9.5}
        x={350}
        y={251}
      >
        dead tuple (needs VACUUM)
      </text>
    </svg>
  );
}
