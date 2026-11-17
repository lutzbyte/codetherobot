import { tileKindAt } from "@/engine/level";
import type { LevelDef, Vec } from "@/engine/types";

export const HALF_W = 48;
export const HALF_H = 24;
export const TILE_H = 16;
/** Ruang di atas tile untuk objek tinggi (pohon, bendera, robot). */
const HEADROOM = 80;

export function project(v: Vec): { x: number; y: number } {
  return { x: (v.c - v.r) * HALF_W, y: (v.c + v.r) * HALF_H };
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function levelBounds(level: LevelDef): Bounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  level.rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (tileKindAt(level, { r, c }) === "void") continue;
      const p = project({ r, c });
      minX = Math.min(minX, p.x - HALF_W);
      maxX = Math.max(maxX, p.x + HALF_W);
      minY = Math.min(minY, p.y - HALF_H - HEADROOM);
      maxY = Math.max(maxY, p.y + HALF_H + TILE_H);
    }
  });

  if (!Number.isFinite(minX)) {
    return { x: -HALF_W, y: -HALF_H, w: HALF_W * 2, h: HALF_H * 2 };
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}