import { LEVELS_PER_WORLD, parseLevelId } from "@/data/uiData";
import { evaluateObjectives, starsFromObjectives } from "@/engine/objectives";
import type { Objective, RunStats } from "@/engine/objectives";
import type { LevelDef } from "@/engine/types";

export const WORLD_COUNT = 5;
/** Jumlah level yang harus selesai di sebuah world untuk membuka world berikutnya. */
export const WORLD_UNLOCK_REQUIREMENT = 10;

export interface LevelRecord {
  stars: number;
  bestBlocks: number;
  bestSteps: number;
  /** True jika pernah selesai dengan blok sebanyak par atau kurang. */
  efficient: boolean;
}

export interface Equipped {
  skin: string;
  accessory: string;
  trail: string;
}

export const DEFAULT_EQUIPPED: Equipped = {
  skin: "skin:classic",
  accessory: "acc:none",
  trail: "trail:none",
};

export interface ModeRecords {
  endlessBest: number;
  /** Waktu tercepat (detik) pada Time Challenge, atau null jika belum pernah menang. */
  timeBest: number | null;
  timeWins: number;
  minimumSolved: number;
}

export interface ProgressData {
  version: 2;
  /** Waktu terakhir disimpan (ms). Dipakai memilih salinan terbaru saat memuat. */
  savedAt: number;
  levels: Record<string, LevelRecord>;
  xp: number;
  coins: number;
  /** Total koin yang pernah diperoleh (bukan saldo). */
  coinsEarned: number;
  /** id achievement → waktu terbuka. */
  achievements: Record<string, number>;
  /** Tanggal (YYYY-MM-DD) → bintang terbaik daily challenge. */
  dailyDone: Record<string, number>;
  /** Kunci minggu → sudah diklaim. */
  weeklyClaimed: Record<string, boolean>;
  modes: ModeRecords;
  /** Id kosmetik yang dibeli dengan koin. */
  owned: string[];
  equipped: Equipped;
}

export interface LevelResult {
  levelId: string;
  /** Bintang pada permainan ini (bukan rekor terbaik). */
  stars: number;
  objectives: Objective[];
  coins: number;
  xp: number;
  firstClear: boolean;
  improved: boolean;
  /** Level pemain baru jika naik level. */
  levelUp: number | null;
  /** Id achievement yang terbuka karena permainan ini. */
  unlocked: string[];
}

export function createProgress(): ProgressData {
  return {
    version: 2,
    savedAt: 0,
    levels: {},
    xp: 0,
    coins: 0,
    coinsEarned: 0,
    achievements: {},
    dailyDone: {},
    weeklyClaimed: {},
    modes: { endlessBest: 0, timeBest: null, timeWins: 0, minimumSolved: 0 },
    owned: [],
    equipped: { ...DEFAULT_EQUIPPED },
  };
}

/* ---------- XP dan level pemain ---------- */

/** Total XP yang dibutuhkan untuk mencapai level tertentu. */
export const xpForLevel = (level: number): number => 50 * level * (level - 1);

export function playerLevel(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export function levelProgress(xp: number): {
  level: number;
  current: number;
  needed: number;
} {
  const level = playerLevel(xp);
  const base = xpForLevel(level);
  return { level, current: xp - base, needed: xpForLevel(level + 1) - base };
}

/** Level baru jika XP berpindah ke level yang lebih tinggi, selain itu null. */
export function levelUpOf(before: ProgressData, after: ProgressData): number | null {
  const next = playerLevel(after.xp);
  return next > playerLevel(before.xp) ? next : null;
}

export function grant(data: ProgressData, coins: number, xp: number): ProgressData {
  return {
    ...data,
    coins: data.coins + coins,
    coinsEarned: data.coinsEarned + coins,
    xp: data.xp + xp,
  };
}

/* ---------- Membaca data tersimpan ---------- */

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function countRecord(
  value: unknown,
  keyOk: (key: string) => boolean,
  max = Number.POSITIVE_INFINITY,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof value !== "object" || value === null) return out;
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (keyOk(key) && isCount(entry) && entry <= max) out[key] = entry;
  }
  return out;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Membaca data tersimpan dengan aman. Versi 1 (Fase 6) dimigrasi ke versi 2.
 * Data rusak diganti dengan progres kosong.
 */
export function parseProgress(value: unknown): ProgressData {
  if (typeof value !== "object" || value === null) return createProgress();
  const raw = value as Record<string, unknown>;
  if (
    (raw.version !== 1 && raw.version !== 2) ||
    typeof raw.levels !== "object" ||
    raw.levels === null
  ) {
    return createProgress();
  }

  const levels: Record<string, LevelRecord> = {};
  for (const [id, entry] of Object.entries(raw.levels as Record<string, unknown>)) {
    if (typeof entry !== "object" || entry === null || !parseLevelId(id)) continue;
    const rec = entry as Record<string, unknown>;
    if (
      isCount(rec.stars) &&
      rec.stars <= 3 &&
      isCount(rec.bestBlocks) &&
      isCount(rec.bestSteps)
    ) {
      levels[id] = {
        stars: rec.stars,
        bestBlocks: rec.bestBlocks,
        bestSteps: rec.bestSteps,
        efficient: rec.efficient === true,
      };
    }
  }

  const base = createProgress();
  const coins = isCount(raw.coins) ? raw.coins : 0;
  const data: ProgressData = {
    ...base,
    levels,
    xp: isCount(raw.xp) ? raw.xp : 0,
    coins,
    coinsEarned: isCount(raw.coinsEarned) ? raw.coinsEarned : coins,
    savedAt: isCount(raw.savedAt) ? raw.savedAt : 0,
  };
  if (raw.version === 1) return data;

  const modes = (typeof raw.modes === "object" && raw.modes !== null
    ? raw.modes
    : {}) as Record<string, unknown>;
  const equipped = (typeof raw.equipped === "object" && raw.equipped !== null
    ? raw.equipped
    : {}) as Record<string, unknown>;

  const weeklyClaimed: Record<string, boolean> = {};
  if (typeof raw.weeklyClaimed === "object" && raw.weeklyClaimed !== null) {
    for (const [key, entry] of Object.entries(raw.weeklyClaimed as Record<string, unknown>)) {
      if (entry === true) weeklyClaimed[key] = true;
    }
  }

  return {
    ...data,
    achievements: countRecord(raw.achievements, (key) => key.length > 0),
    dailyDone: countRecord(raw.dailyDone, (key) => DATE_KEY.test(key), 3),
    weeklyClaimed,
    modes: {
      endlessBest: isCount(modes.endlessBest) ? modes.endlessBest : 0,
      timeBest: isCount(modes.timeBest) ? modes.timeBest : null,
      timeWins: isCount(modes.timeWins) ? modes.timeWins : 0,
      minimumSolved: isCount(modes.minimumSolved) ? modes.minimumSolved : 0,
    },
    owned: Array.isArray(raw.owned)
      ? raw.owned.filter((id): id is string => typeof id === "string")
      : [],
    equipped: {
      skin: text(equipped.skin, DEFAULT_EQUIPPED.skin),
      accessory: text(equipped.accessory, DEFAULT_EQUIPPED.accessory),
      trail: text(equipped.trail, DEFAULT_EQUIPPED.trail),
    },
  };
}

/* ---------- Hadiah dan penyelesaian level ---------- */

/** Clear pertama memberi hadiah penuh. Mengulang hanya memberi hadiah untuk bintang tambahan. */
export function rewardFor(
  stars: number,
  previousStars: number,
): { coins: number; xp: number } {
  if (previousStars === 0) {
    return { coins: 10 + 10 * stars, xp: 30 + 10 * stars };
  }
  const gained = Math.max(0, stars - previousStars);
  return { coins: 10 * gained, xp: 10 * gained };
}

export function applyCompletion(
  data: ProgressData,
  level: LevelDef,
  stats: RunStats,
): { next: ProgressData; result: LevelResult } {
  const objectives = evaluateObjectives(level, stats);
  const stars = starsFromObjectives(objectives);
  const previous = data.levels[level.id];
  const previousStars = previous?.stars ?? 0;
  const reward = rewardFor(stars, previousStars);
  const efficientNow = objectives.find((o) => o.id === "blocks")?.done === true;

  const record: LevelRecord = {
    stars: Math.max(stars, previousStars),
    bestBlocks: previous ? Math.min(previous.bestBlocks, stats.blocks) : stats.blocks,
    bestSteps: previous ? Math.min(previous.bestSteps, stats.steps) : stats.steps,
    efficient: (previous?.efficient ?? false) || efficientNow,
  };

  const withLevel: ProgressData = {
    ...data,
    levels: { ...data.levels, [level.id]: record },
  };

  return {
    next: grant(withLevel, reward.coins, reward.xp),
    result: {
      levelId: level.id,
      stars,
      objectives,
      coins: reward.coins,
      xp: reward.xp,
      firstClear: previousStars === 0,
      improved: stars > previousStars,
      levelUp: null,
      unlocked: [],
    },
  };
}

/* ---------- Statistik dan unlock ---------- */

/** Jumlah level yang sudah selesai (minimal 1 bintang) di sebuah world. */
export function levelsDone(data: ProgressData, worldId: number): number {
  let done = 0;
  for (let n = 1; n <= LEVELS_PER_WORLD; n++) {
    if ((data.levels[`${worldId}-${n}`]?.stars ?? 0) >= 1) done += 1;
  }
  return done;
}

export function worldStars(data: ProgressData, worldId: number): number {
  let total = 0;
  for (let n = 1; n <= LEVELS_PER_WORLD; n++) {
    total += data.levels[`${worldId}-${n}`]?.stars ?? 0;
  }
  return total;
}

export function levelsCompleted(data: ProgressData): number {
  return Object.values(data.levels).filter((r) => r.stars >= 1).length;
}

export function totalStars(data: ProgressData): number {
  return Object.values(data.levels).reduce((sum, r) => sum + r.stars, 0);
}

export function perfectLevels(data: ProgressData): number {
  return Object.values(data.levels).filter((r) => r.stars >= 3).length;
}

export function efficientLevels(data: ProgressData): number {
  return Object.values(data.levels).filter((r) => r.efficient).length;
}

export function isWorldUnlocked(
  data: ProgressData,
  worldId: number,
  unlockAll: boolean,
): boolean {
  if (unlockAll || worldId === 1) return true;
  return levelsDone(data, worldId - 1) >= WORLD_UNLOCK_REQUIREMENT;
}

export function isLevelUnlocked(
  data: ProgressData,
  levelId: string,
  unlockAll: boolean,
): boolean {
  const parsed = parseLevelId(levelId);
  if (!parsed || parsed.world < 1 || parsed.world > WORLD_COUNT) return false;
  if (parsed.level < 1 || parsed.level > LEVELS_PER_WORLD) return false;
  if (unlockAll) return true;
  if (!isWorldUnlocked(data, parsed.world, false)) return false;
  if (parsed.level === 1) return true;
  return (data.levels[`${parsed.world}-${parsed.level - 1}`]?.stars ?? 0) >= 1;
}