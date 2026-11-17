import type { Direction, LevelDef, ObjectKind, TileKind, Vec } from "./types";

export const DIRECTION_VECTORS: readonly Vec[] = [
  { r: -1, c: 0 },
  { r: 0, c: 1 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
];

export const BLOCKING_KINDS: ReadonlySet<ObjectKind> = new Set<ObjectKind>([
  "stone",
  "crate",
  "tree",
]);

export function turnLeft(d: Direction): Direction {
  return ((d + 3) % 4) as Direction;
}

export function turnRight(d: Direction): Direction {
  return ((d + 1) % 4) as Direction;
}

export function sameVec(a: Vec, b: Vec): boolean {
  return a.r === b.r && a.c === b.c;
}

export function step(v: Vec, d: Direction): Vec {
  const delta = DIRECTION_VECTORS[d] ?? { r: 0, c: 0 };
  return { r: v.r + delta.r, c: v.c + delta.c };
}

/** Jenis tile di posisi v, atau null jika di luar grid. */
export function tileKindAt(level: LevelDef, v: Vec): TileKind | null {
  const row = level.rows[v.r];
  if (row === undefined || v.c < 0 || v.c >= row.length) return null;
  const ch = row.charAt(v.c);
  if (ch === "g") return "grass";
  if (ch === "p") return "path";
  return "void";
}

export function isFloor(level: LevelDef, v: Vec): boolean {
  const kind = tileKindAt(level, v);
  return kind === "grass" || kind === "path";
}

/** Memeriksa konsistensi data level. Mengembalikan daftar masalah (kosong = valid). */
export function validateLevel(level: LevelDef): string[] {
  const errors: string[] = [];

  if (!isFloor(level, level.start)) errors.push("start is not on a floor tile");
  if (!isFloor(level, level.goal)) errors.push("goal is not on a floor tile");

  const ids = new Set<string>();
  for (const obj of level.objects) {
    if (ids.has(obj.id)) errors.push(`duplicate object id: ${obj.id}`);
    ids.add(obj.id);

    if (!isFloor(level, obj.at)) {
      errors.push(`object ${obj.id} is not on a floor tile`);
    }
    if (BLOCKING_KINDS.has(obj.kind)) {
      if (sameVec(obj.at, level.start)) errors.push(`object ${obj.id} blocks the start tile`);
      if (sameVec(obj.at, level.goal)) errors.push(`object ${obj.id} blocks the goal tile`);
    }
    if (obj.kind === "switch") {
      const target = level.objects.find((o) => o.id === obj.linkedTo);
      if (!target || target.kind !== "gate") {
        errors.push(`switch ${obj.id} must link to a gate`);
      }
    }
  }

  return errors;
}