import { DIRECTION_VECTORS } from "@/engine/level";
import type { Direction, LevelObject, Vec } from "@/engine/types";
import { choice, shuffled } from "./rng";
import type { Rng } from "./rng";

/** -1 = belok kiri, 0 = lurus, 1 = belok kanan. */
export type Turn = -1 | 0 | 1;

/** Satu ruas jalur: jalan sejauh len, lalu belok (turn) di ujungnya. */
export interface Leg {
  len: number;
  turn: Turn;
}

export const leg = (len: number, turn: Turn = 0): Leg => ({ len, turn });

export function turnDir(dir: Direction, turn: Turn): Direction {
  return ((dir + turn + 4) % 4) as Direction;
}

export const key = (v: Vec): string => `${v.r},${v.c}`;

/** Daftar tile jalur mulai dari (0, 0). */
export function walkLegs(legs: readonly Leg[], startDir: Direction): Vec[] {
  const tiles: Vec[] = [{ r: 0, c: 0 }];
  let dir = startDir;
  let pos: Vec = { r: 0, c: 0 };
  for (const l of legs) {
    const delta = DIRECTION_VECTORS[dir] ?? { r: 0, c: 0 };
    for (let i = 0; i < l.len; i++) {
      pos = { r: pos.r + delta.r, c: pos.c + delta.c };
      tiles.push(pos);
    }
    dir = turnDir(dir, l.turn);
  }
  return tiles;
}

/**
 * Jalur tidak boleh memotong dirinya sendiri. Mode strict juga melarang tile
 * non-berurutan saling bersebelahan, supaya sensor tidak salah membaca jalur.
 */
export function isSimple(tiles: readonly Vec[], strict: boolean): boolean {
  const seen = new Set<string>();
  for (const t of tiles) {
    const k = key(t);
    if (seen.has(k)) return false;
    seen.add(k);
  }
  if (!strict) return true;
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 2; j < tiles.length; j++) {
      const a = tiles[i];
      const b = tiles[j];
      if (a && b && Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1) return false;
    }
  }
  return true;
}

const MARGIN = 1;
const MAX_BBOX_SUM = 14;
const MAX_BBOX_SIDE = 12;

export interface Layout {
  rows: string[];
  /** Posisi tile jalur setelah digeser ke dalam peta. */
  tiles: Vec[];
}

/**
 * Membuat peta dari jalur.
 * open: seluruh area di sekitar jalur berupa rumput (bisa dilewati).
 * ribbon: tile di sebelah jalur kosong, sehingga jalur tidak bisa dipotong dan
 * sensor hanya melihat jalur itu sendiri.
 * Mengembalikan null jika peta terlalu besar.
 */
export function layout(tiles: readonly Vec[], mode: "open" | "ribbon"): Layout | null {
  const rs = tiles.map((t) => t.r);
  const cs = tiles.map((t) => t.c);
  const minR = Math.min(...rs);
  const maxR = Math.max(...rs);
  const minC = Math.min(...cs);
  const maxC = Math.max(...cs);
  const bboxH = maxR - minR + 1;
  const bboxW = maxC - minC + 1;
  if (bboxW + bboxH > MAX_BBOX_SUM || Math.max(bboxW, bboxH) > MAX_BBOX_SIDE) {
    return null;
  }

  const shifted = tiles.map((t) => ({
    r: t.r - minR + MARGIN,
    c: t.c - minC + MARGIN,
  }));
  const height = bboxH + MARGIN * 2;
  const width = bboxW + MARGIN * 2;
  const onPath = new Set(shifted.map(key));

  const rows: string[] = [];
  for (let r = 0; r < height; r++) {
    let row = "";
    for (let c = 0; c < width; c++) {
      if (onPath.has(key({ r, c }))) {
        row += "p";
      } else if (mode === "open") {
        row += "g";
      } else {
        const near = shifted.some(
          (t) => Math.abs(t.r - r) <= 1 && Math.abs(t.c - c) <= 1,
        );
        row += near ? "." : "g";
      }
    }
    rows.push(row);
  }
  return { rows, tiles: shifted };
}

/** Dekorasi (pohon, batu, peti) hanya di tile rumput, tidak pernah di jalur. */
export function decorate(
  rows: readonly string[],
  rng: Rng,
  density: number,
): LevelObject[] {
  const objects: LevelObject[] = [];
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row.charAt(c) !== "g" || rng() >= density) continue;
      const roll = rng();
      const kind = roll < 0.5 ? "tree" : roll < 0.75 ? "stone" : "crate";
      objects.push({ id: `deco-${objects.length + 1}`, kind, at: { r, c } });
    }
  });
  return objects;
}

export interface SwitchPair {
  switchIdx: number;
  gateIdx: number;
}

/** Posisi fitur sebagai indeks pada daftar tile jalur. */
export interface Placement {
  starIdx: number[];
  pairs: SwitchPair[];
}

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

function isStraightAt(tiles: readonly Vec[], i: number): boolean {
  const a = tiles[i - 1];
  const b = tiles[i];
  const c = tiles[i + 1];
  if (!a || !b || !c) return false;
  return b.r - a.r === c.r - b.r && b.c - a.c === c.c - b.c;
}

/**
 * Menempatkan bintang dan sepasang switch + gerbang di jalur.
 * Gerbang selalu berada setelah switch-nya, dan tidak pernah di start atau goal.
 */
export function placeFeatures(
  tiles: readonly Vec[],
  rng: Rng,
  stars: number,
  gate: boolean,
  switchCandidates?: readonly number[],
): Placement | null {
  const last = tiles.length - 1;
  const used = new Set<number>();
  const pairs: SwitchPair[] = [];

  if (gate) {
    const base =
      switchCandidates ?? range(1, last - 2).filter((i) => isStraightAt(tiles, i));
    const pool = base.filter((i) => i >= 1 && i <= last - 2);
    const switchIdx = choice(rng, pool);
    if (switchIdx === undefined) return null;
    const gateIdx = choice(rng, range(switchIdx + 1, last - 1));
    if (gateIdx === undefined) return null;
    used.add(switchIdx);
    used.add(gateIdx);
    pairs.push({ switchIdx, gateIdx });
  }

  const free = range(1, last - 1).filter((i) => !used.has(i));
  if (free.length < stars) return null;
  const starIdx = shuffled(rng, free)
    .slice(0, stars)
    .sort((a, b) => a - b);
  return { starIdx, pairs };
}