// Diagrams for the pgvector lesson's index chapters. Vectors are drawn as points on
// a plane: real embeddings have hundreds of dimensions, but the idea is the same.

const INK = "#3f3f46";
const MUTED = "#a1a1aa";
const ACCENT = "#0284c7";
const MISS = "#e11d48";

type Point = readonly [number, number];

function Star({ at }: { at: Point }) {
  const [x, y] = at;
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 8 : 3.5;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon fill="#f59e0b" points={points} stroke="#b45309" strokeWidth={1} />;
}

function Centroid({ at }: { at: Point }) {
  const [x, y] = at;
  return (
    <g stroke={INK} strokeWidth={2}>
      <line x1={x - 5} x2={x + 5} y1={y - 5} y2={y + 5} />
      <line x1={x - 5} x2={x + 5} y1={y + 5} y2={y - 5} />
    </g>
  );
}

const ivfLists: readonly {
  centroid: Point;
  points: readonly Point[];
  probed?: boolean;
}[] = [
  {
    centroid: [78, 58],
    probed: true,
    points: [
      [40, 30],
      [62, 84],
      [100, 36],
      [118, 80],
      [30, 70],
      [92, 96],
    ],
  },
  {
    centroid: [238, 62],
    points: [
      [200, 34],
      [278, 40],
      [260, 92],
      [210, 96],
      [292, 76],
    ],
  },
  {
    centroid: [82, 168],
    points: [
      [44, 150],
      [110, 146],
      [60, 196],
      [124, 188],
      [30, 182],
    ],
  },
  {
    centroid: [236, 170],
    points: [
      [196, 148],
      [272, 150],
      [214, 198],
      [282, 194],
      [250, 132],
    ],
  },
];

const ivfQuery: Point = [140, 56];
const ivfMissed: Point = [170, 52];

export function IvfflatDiagram() {
  return (
    <figure className="mt-4">
      <svg
        aria-label="IVFFlat: vectors split into four lists around centroids. The search reads only the list whose centroid is nearest to the question, and misses a closer vector just across the border."
        className="h-auto w-full max-w-[480px]"
        role="img"
        viewBox="0 0 320 240"
      >
        <rect fill="#e0f2fe" height={118} width={156} x={0} y={0} />
        <line stroke={MUTED} strokeDasharray="4 3" x1={156} x2={160} y1={0} y2={240} />
        <line stroke={MUTED} strokeDasharray="4 3" x1={0} x2={320} y1={118} y2={124} />

        {ivfLists.map((list) =>
          list.points.map(([x, y]) => (
            <circle
              cx={x}
              cy={y}
              fill={list.probed ? ACCENT : MUTED}
              key={`${x}-${y}`}
              r={4}
            />
          )),
        )}
        {ivfLists.map((list) => (
          <Centroid at={list.centroid} key={list.centroid.join("-")} />
        ))}

        <circle cx={ivfMissed[0]} cy={ivfMissed[1]} fill={MUTED} r={4} />
        <circle
          cx={ivfMissed[0]}
          cy={ivfMissed[1]}
          fill="none"
          r={8}
          stroke={MISS}
          strokeWidth={1.5}
        />
        <Star at={ivfQuery} />

        <text fill={INK} fontSize={10} x={8} y={112}>
          list read (probes = 1)
        </text>
        <text fill={MISS} fontSize={10} x={180} y={20}>
          closer, but in another list
        </text>
        <text fill="#b45309" fontSize={10} x={104} y={30}>
          question
        </text>
      </svg>
      <figcaption className="mt-2 text-sm leading-6 text-zinc-600">
        IVFFlat splits the vectors into lists around centroids (×). A search reads only
        the list whose centroid is nearest to the question (★), here the blue one. The
        vector circled in red is closer, but sits in another list, so it is missed unless{" "}
        <code>ivfflat.probes</code> reads more lists.
      </figcaption>
    </figure>
  );
}

const hnswLayers: readonly { y: number; label: string; xs: readonly number[] }[] = [
  { y: 36, label: "layer 2: few vectors, long links", xs: [40, 150, 250] },
  { y: 106, label: "layer 1", xs: [40, 95, 150, 200, 250, 295] },
  {
    y: 176,
    label: "layer 0: every vector",
    xs: [20, 50, 80, 110, 140, 170, 200, 225, 250, 280, 306],
  },
];

// The search: enter at the top, move to the neighbour closest to the question,
// drop a layer, repeat.
const hnswPath: readonly Point[] = [
  [40, 36],
  [150, 36],
  [250, 36],
  [250, 106],
  [250, 176],
  [280, 176],
];

const hnswQuery: Point = [276, 206];

export function HnswDiagram() {
  return (
    <figure className="mt-4">
      <svg
        aria-label="HNSW: three layers of linked vectors. A search enters at the sparse top layer, jumps towards the question, and drops down layer by layer to the nearest vector."
        className="h-auto w-full max-w-[480px]"
        role="img"
        viewBox="0 0 320 224"
      >
        {hnswLayers.map((layer) => (
          <g key={layer.y}>
            {layer.xs.slice(1).map((x, i) => (
              <line
                key={x}
                stroke={MUTED}
                x1={layer.xs[i]}
                x2={x}
                y1={layer.y}
                y2={layer.y}
              />
            ))}
            <text fill={INK} fontSize={10} x={4} y={layer.y - 12}>
              {layer.label}
            </text>
          </g>
        ))}

        {hnswLayers
          .slice(0, -1)
          .map((layer) =>
            layer.xs.map((x) => (
              <line
                key={`${layer.y}-${x}`}
                stroke={MUTED}
                strokeDasharray="2 3"
                x1={x}
                x2={x}
                y1={layer.y}
                y2={176}
              />
            )),
          )}

        <polyline
          fill="none"
          points={hnswPath.map(([x, y]) => `${x},${y}`).join(" ")}
          stroke={ACCENT}
          strokeLinejoin="round"
          strokeWidth={3}
        />

        {hnswLayers.map((layer) =>
          layer.xs.map((x) => (
            <circle
              cx={x}
              cy={layer.y}
              fill={
                hnswPath.some(([px, py]) => px === x && py === layer.y) ? ACCENT : "#fff"
              }
              key={`${layer.y}-${x}`}
              r={5}
              stroke={INK}
              strokeWidth={1.5}
            />
          )),
        )}

        <Star at={hnswQuery} />
        <text fill="#b45309" fontSize={10} x={214} y={214}>
          question
        </text>
      </svg>
      <figcaption className="mt-2 text-sm leading-6 text-zinc-600">
        HNSW links every vector to its nearest neighbours, in layers. Upper layers hold
        fewer vectors and longer links. A search enters at the top, jumps towards the
        question (★), drops down a layer, and repeats, reaching the nearest vectors in a
        few hops instead of measuring every one.
      </figcaption>
    </figure>
  );
}
