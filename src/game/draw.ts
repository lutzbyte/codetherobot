import Phaser from "phaser";

export interface CubeColors {
  top: number;
  left: number;
  right: number;
}

export const GRASS_A: CubeColors = { top: 0x79c14b, left: 0x8a5a34, right: 0x6e4527 };
export const GRASS_B: CubeColors = { top: 0x6fb844, left: 0x8a5a34, right: 0x6e4527 };
export const PATH: CubeColors = { top: 0xd9dde6, left: 0x9aa1b0, right: 0x838a9b };
export const GOAL: CubeColors = { top: 0xffd54a, left: 0xe0a800, right: 0xc48f00 };
export const STONE: CubeColors = { top: 0x9aa2b2, left: 0x727a8c, right: 0x5b6376 };
export const CRATE: CubeColors = { top: 0xc08a4a, left: 0x8d5a2e, right: 0x744623 };
export const PURPLE: CubeColors = { top: 0x9a82ff, left: 0x5b43c4, right: 0x47339c };

function v(x: number, y: number): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(x, y);
}

/** Kubus isometrik. (cx, cy) = pusat sisi atas, s = setengah lebar, h = tinggi. */
export function drawCube(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  s: number,
  h: number,
  colors: CubeColors,
): void {
  const hs = s / 2;
  g.fillStyle(colors.left, 1);
  g.fillPoints(
    [v(cx - s, cy), v(cx, cy + hs), v(cx, cy + hs + h), v(cx - s, cy + h)],
    true,
  );
  g.fillStyle(colors.right, 1);
  g.fillPoints(
    [v(cx, cy + hs), v(cx + s, cy), v(cx + s, cy + h), v(cx, cy + hs + h)],
    true,
  );
  g.fillStyle(colors.top, 1);
  g.fillPoints(
    [v(cx, cy - hs), v(cx + s, cy), v(cx, cy + hs), v(cx - s, cy)],
    true,
  );
}

export function starPolygon(
  cx: number,
  cy: number,
  outer: number,
): Phaser.Math.Vector2[] {
  const inner = outer * 0.45;
  const points: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(v(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)));
  }
  return points;
}