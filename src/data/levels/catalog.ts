import { act } from "@/engine/builders";
import type { Roots } from "@/engine/editor";
import type { LevelDef } from "@/engine/types";
import { LEVELS_PER_WORLD, WORLDS } from "../uiData";
import {
  assemble,
  buildWorld1,
  buildWorld2,
  buildWorld3,
  buildWorld4,
  buildWorld5,
} from "./families";
import type { Build, LevelEntry } from "./families";
import { createRng } from "./rng";
import type { Rng } from "./rng";

const BUILDERS: Record<number, (index: number, rng: Rng) => Build | null> = {
  1: buildWorld1,
  2: buildWorld2,
  3: buildWorld3,
  4: buildWorld4,
  5: buildWorld5,
};

const MAX_ATTEMPTS = 40;

function seedFor(world: number, index: number, attempt: number): number {
  return (world * 100003 + index * 1009 + attempt * 7919 + 20241) >>> 0;
}

/** Level cadangan sederhana, hanya dipakai jika generator gagal (tes akan menandainya). */
function fallbackEntry(id: string, name: string): LevelEntry {
  const level: LevelDef = {
    id,
    name,
    rows: ["gggggg", "pppppp", "gggggg"],
    start: { r: 1, c: 0 },
    startDir: 1,
    goal: { r: 1, c: 5 },
    objects: [],
    parCommands: 5,
    parSteps: 5,
    difficulty: 1,
    maxInstructions: 10,
    allowedCommands: ["move"],
    tutorial: "Walk to the flag with Move Forward.",
  };
  const solution: Roots = {
    program: [1, 2, 3, 4, 5].map((n) => act(n, "forward")),
    functions: [],
  };
  return { level, solution, fallback: true };
}

/**
 * Membuat satu level dari generator world tertentu. seedBase mengubah hasil
 * (0 untuk katalog tetap; tantangan harian dan mode lain memakai seed sendiri).
 */
export function generateEntry(
  world: number,
  index: number,
  id: string,
  name: string,
  seedBase = 0,
): LevelEntry {
  const difficulty = Math.min(5, Math.ceil(index / 3));
  const builder = BUILDERS[world];

  if (builder) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const rng = createRng(seedFor(world, index, attempt) + seedBase);
      const build = builder(index, rng);
      const entry = build ? assemble(id, name, difficulty, build, rng) : null;
      if (entry) return entry;
    }
  }
  return fallbackEntry(id, name);
}

export function buildCatalog(): LevelEntry[] {
  const entries: LevelEntry[] = [];
  for (const world of WORLDS) {
    for (let index = 1; index <= LEVELS_PER_WORLD; index++) {
      entries.push(generateEntry(world.id, index, `${world.id}-${index}`, `${world.title} ${index}`));
    }
  }
  return entries;
}

let cache: readonly LevelEntry[] | null = null;

/** Katalog 75 level, dibuat sekali saat pertama dibutuhkan. */
export function getCatalog(): readonly LevelEntry[] {
  if (!cache) cache = buildCatalog();
  return cache;
}

export function getLevelEntry(levelId: string): LevelEntry | undefined {
  return getCatalog().find((entry) => entry.level.id === levelId);
}