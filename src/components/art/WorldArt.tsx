import type { WorldTheme } from "@/data/uiData";
import { IsoCube, IsoTree } from "./IsoShapes";

interface Palette {
  top: string;
  left: string;
  right: string;
  line: string;
}

const PALETTES: Record<WorldTheme, Palette> = {
  grass: { top: "#79c14b", left: "#8a5a34", right: "#6e4527", line: "#62a63a" },
  desert: { top: "#f0c15c", left: "#c98a3c", right: "#a8702c", line: "#d9a640" },
  ice: { top: "#c4e8fb", left: "#4a90d9", right: "#3573b8", line: "#9fd0ee" },
  factory: { top: "#7f8696", left: "#4a4f5c", right: "#3a3f4a", line: "#6a7080" },
  space: { top: "#8b6fe0", left: "#4b3a8f", right: "#3a2c73", line: "#7458cc" },
};

/** Titik tengah tile (i, j) pada platform 3x3. */
function tile(i: number, j: number): { x: number; y: number } {
  const u = (i + 0.5) / 3;
  const v = (j + 0.5) / 3;
  return { x: 80 + 70 * u - 70 * v, y: 20 + 35 * u + 35 * v };
}

function Decor({ theme }: { theme: WorldTheme }) {
  const a = tile(0, 2);
  const b = tile(2, 1);
  const c = tile(1, 0);
  const d = tile(2, 2);

  switch (theme) {
    case "grass":
      return (
        <g>
          <IsoTree x={a.x} y={a.y + 4} r={12} />
          <IsoTree x={b.x} y={b.y + 4} r={13} />
          <IsoTree x={d.x} y={d.y + 2} r={9} />
        </g>
      );
    case "desert":
      return (
        <g>
          <g fill="#4f9a3a">
            <rect x={a.x - 3} y={a.y - 22} width="6" height="26" rx="3" />
            <rect x={a.x - 11} y={a.y - 14} width="5" height="11" rx="2.5" />
            <rect x={a.x + 6} y={a.y - 17} width="5" height="11" rx="2.5" />
          </g>
          <IsoCube x={b.x} y={b.y - 6} s={12} h={10} top="#d9a640" left="#b07a2c" right="#946323" />
          <IsoCube x={d.x} y={d.y - 4} s={8} h={7} top="#d9a640" left="#b07a2c" right="#946323" />
        </g>
      );
    case "ice":
      return (
        <g>
          {[a, b, d].map((p, idx) => (
            <g key={idx}>
              <polygon points={`${p.x - 7},${p.y + 2} ${p.x},${p.y - 20} ${p.x + 7},${p.y + 2}`} fill="#e9f8ff" />
              <polygon points={`${p.x},${p.y - 20} ${p.x + 7},${p.y + 2} ${p.x + 2},${p.y + 2}`} fill="#9fd0ee" />
            </g>
          ))}
        </g>
      );
    case "factory":
      return (
        <g>
          <IsoCube x={a.x} y={a.y - 8} s={12} h={12} top="#c08a4a" left="#8d5a2e" right="#744623" />
          <IsoCube x={c.x} y={c.y - 8} s={12} h={12} top="#c08a4a" left="#8d5a2e" right="#744623" />
          <circle cx={b.x} cy={b.y - 4} r="8" fill="#3a3f4a" />
          <circle cx={b.x} cy={b.y - 4} r="3" fill="#7f8696" />
        </g>
      );
    case "space":
      return (
        <g>
          {[a, b].map((p, idx) => (
            <g key={idx}>
              <polygon points={`${p.x - 6},${p.y + 2} ${p.x},${p.y - 20} ${p.x + 6},${p.y + 2}`} fill="#d9ccff" />
              <polygon points={`${p.x},${p.y - 20} ${p.x + 6},${p.y + 2} ${p.x + 2},${p.y + 2}`} fill="#a58cf0" />
            </g>
          ))}
          <circle cx={d.x} cy={d.y - 10} r="7" fill="#f5882a" />
        </g>
      );
  }
}

interface WorldArtProps {
  theme: WorldTheme;
  className?: string;
}

export function WorldArt({ theme, className }: WorldArtProps) {
  const p = PALETTES[theme];
  const edge = (t: number) => ({
    ne: { x: 80 + 70 * t, y: 20 + 35 * t },
    ws: { x: 10 + 70 * t, y: 55 + 35 * t },
    nw: { x: 80 - 70 * t, y: 20 + 35 * t },
    es: { x: 150 - 70 * t, y: 55 + 35 * t },
  });
  const lines = [1 / 3, 2 / 3].map(edge);

  return (
    <svg
      className={className}
      viewBox="0 0 160 120"
      aria-hidden="true"
      focusable="false"
    >
      <IsoCube x={80} y={55} s={70} h={22} top={p.top} left={p.left} right={p.right} />
      <g stroke={p.line} strokeWidth="1.2" opacity="0.8">
        {lines.map((e, i) => (
          <g key={i}>
            <line x1={e.ne.x} y1={e.ne.y} x2={e.ws.x} y2={e.ws.y} />
            <line x1={e.nw.x} y1={e.nw.y} x2={e.es.x} y2={e.es.y} />
          </g>
        ))}
      </g>
      <Decor theme={theme} />
      <line x1="80" y1="56" x2="80" y2="24" stroke="#6b4a2a" strokeWidth="2" />
      <polygon points="80,24 99,31 80,38" fill="#e5483d" />
    </svg>
  );
}