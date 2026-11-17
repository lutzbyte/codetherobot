import { generateEntry } from "./catalog";
import type { LevelEntry } from "./families";

function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Level harian: ditentukan sepenuhnya oleh tanggal, jadi sama untuk semua pemain. */
export function dailyEntry(dateKey: string): LevelEntry {
  const h = hashString(dateKey);
  const world = 1 + (h % 5);
  const index = 7 + (Math.floor(h / 5) % 9);
  return generateEntry(world, index, `daily-${dateKey}`, "Daily Challenge", h);
}

/** World dan nomor level generator untuk ronde Endless: kesulitan naik tiap ronde. */
export function endlessParams(round: number): { world: number; index: number } {
  const r = Math.max(1, round) - 1;
  const world = Math.min(5, 1 + Math.floor(r / 3));
  const index = Math.min(15, 3 + 2 * (r % 3) + 2 * Math.floor(r / 3));
  return { world, index };
}

export function endlessEntry(round: number, seed: number): LevelEntry {
  const { world, index } = endlessParams(round);
  return generateEntry(world, index, `endless-${round}`, `Endless ${round}`, seed + round * 31);
}

export function timeEntry(seed: number): LevelEntry {
  const world = 2 + (seed % 3);
  const index = 5 + (Math.floor(seed / 3) % 6);
  return generateEntry(world, index, `time-${seed}`, "Time Challenge", seed);
}

/** Level dengan batas blok sama dengan par solusi referensi. */
export function minimumEntry(seed: number): LevelEntry {
  const world = 2 + (seed % 4);
  const index = 6 + (Math.floor(seed / 4) % 8);
  const entry = generateEntry(world, index, `minimum-${seed}`, "Minimum Commands", seed);
  const par = entry.level.parCommands;
  return {
    ...entry,
    level: {
      ...entry.level,
      maxInstructions: par,
      tutorial: `Solve it with ${par} blocks or fewer. Look for loops and functions.`,
    },
  };
}