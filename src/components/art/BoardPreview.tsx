import { IsoCube, IsoTree, starPoints } from "./IsoShapes";
import { RobotMascot } from "./RobotMascot";

/**
 * g=grass, p=path, t=tree, s=stone block, c=crate, f=goal, r=robot start.
 * Hanya visual Fase 2. Board interaktif dibangun dengan Phaser di Fase 3.
 */
const MAP = [
  "gggpgg",
  "gtgpsg",
  "pppppg",
  "pgcgpt",
  "pgggpf",
  "rpppgg",
];

const OX = 300;
const OY = 60;
const HALF_W = 48;
const HALF_H = 24;

interface Cell {
  r: number;
  c: number;
  ch: string;
}

function cells(): Cell[] {
  return MAP.flatMap((row, r) =>
    Array.from(row).map((ch, c) => ({ r, c, ch })),
  ).sort((a, b) => a.r + a.c - (b.r + b.c) || a.r - b.r);
}

const GRASS = { top: "#79c14b", left: "#8a5a34", right: "#6e4527" };
const GRASS_ALT = { top: "#6fb844", left: "#8a5a34", right: "#6e4527" };
const PATH = { top: "#d9dde6", left: "#9aa1b0", right: "#838a9b" };
const GOAL = { top: "#ffd54a", left: "#e0a800", right: "#c48f00" };

interface BoardPreviewProps {
  className?: string;
}

export function BoardPreview({ className }: BoardPreviewProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 380"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Game board preview"
    >
      <rect width="600" height="380" fill="#3d93d4" />
      <g stroke="#6bb4e6" strokeWidth="3" strokeLinecap="round" opacity="0.6">
        <path d="M30 330h40M520 340h50M40 60h50M500 40h40" />
      </g>

      {cells().map(({ r, c, ch }) => {
        const cx = OX + (c - r) * HALF_W;
        const cy = OY + (c + r) * HALF_H;
        const isPath = ch === "p" || ch === "r";
        const colors =
          ch === "f"
            ? GOAL
            : isPath
              ? PATH
              : (r + c) % 2 === 0
                ? GRASS
                : GRASS_ALT;
        return (
          <g key={`${r}-${c}`}>
            <IsoCube x={cx} y={cy} s={HALF_W} h={16} {...colors} />
            {ch === "t" && <IsoTree x={cx} y={cy + 4} r={22} />}
            {ch === "s" && (
              <IsoCube x={cx} y={cy - 18} s={34} h={30} top="#9aa2b2" left="#727a8c" right="#5b6376" />
            )}
            {ch === "c" && (
              <IsoCube x={cx} y={cy - 14} s={30} h={26} top="#c08a4a" left="#8d5a2e" right="#744623" />
            )}
            {ch === "f" && (
              <g>
                <polygon points={starPoints(cx, cy - 8, 17)} fill="#ffc21a" stroke="#c48f00" strokeWidth="1.5" />
                <line x1={cx + 14} y1={cy} x2={cx + 14} y2={cy - 62} stroke="#6b4a2a" strokeWidth="3" />
                <polygon points={`${cx + 14},${cy - 62} ${cx + 40},${cy - 52} ${cx + 14},${cy - 42}`} fill="#e5483d" />
              </g>
            )}
            {ch === "r" && <RobotMascot size={70} x={cx - 35} y={cy - 78} />}
          </g>
        );
      })}
    </svg>
  );
}