interface IsoCubeProps {
  /** Pusat belah ketupat sisi atas. */
  x: number;
  y: number;
  /** Setengah lebar tile. */
  s: number;
  /** Tinggi sisi samping. */
  h: number;
  top: string;
  left: string;
  right: string;
}

export function IsoCube({ x, y, s, h, top, left, right }: IsoCubeProps) {
  const hs = s / 2;
  return (
    <g>
      <polygon
        points={`${x - s},${y} ${x},${y + hs} ${x},${y + hs + h} ${x - s},${y + h}`}
        fill={left}
      />
      <polygon
        points={`${x},${y + hs} ${x + s},${y} ${x + s},${y + h} ${x},${y + hs + h}`}
        fill={right}
      />
      <polygon
        points={`${x},${y - hs} ${x + s},${y} ${x},${y + hs} ${x - s},${y}`}
        fill={top}
      />
    </g>
  );
}

interface IsoTreeProps {
  x: number;
  y: number;
  r: number;
}

export function IsoTree({ x, y, r }: IsoTreeProps) {
  return (
    <g>
      <rect
        x={x - r * 0.12}
        y={y - r * 0.2}
        width={r * 0.24}
        height={r * 0.75}
        rx={r * 0.08}
        fill="#7a4b2a"
      />
      <circle cx={x} cy={y - r * 0.9} r={r} fill="#3f9a3a" />
      <circle cx={x - r * 0.3} cy={y - r * 1.15} r={r * 0.62} fill="#5cb84a" />
    </g>
  );
}

export function starPoints(cx: number, cy: number, outer: number): string {
  const inner = outer * 0.45;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(
      `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`,
    );
  }
  return pts.join(" ");
}