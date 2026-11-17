import { useSyncExternalStore } from "react";
import {
  evaluateObjectives,
  starsFromObjectives,
} from "@/engine/objectives";
import type { RunStats } from "@/engine/objectives";
import type { LevelDef } from "@/engine/types";
import { idbDelete, idbGet, idbSet } from "@/storage/idb";
import { unlockAchievements } from "./achievements";
import {
  applyDaily,
  applyEndlessRound,
  applyMinimumWin,
  applyTimeWin,
  claimWeekly,
} from "./challenges";
import { buyItem, equipItem } from "./cosmetics";
import {
  applyCompletion,
  createProgress,
  grant,
  levelUpOf,
  parseProgress,
} from "./progressLogic";
import type { LevelResult, ProgressData } from "./progressLogic";

const LOCAL_KEY = "ctr:progress";
const IDB_KEY = "save";

export interface ChallengeResult {
  kind: "daily" | "endless" | "time" | "minimum";
  coins: number;
  xp: number;
  /** Bintang (hanya daily). */
  stars: number | null;
  first: boolean;
  levelUp: number | null;
  unlocked: string[];
  detail: string;
}

function readLocal(): ProgressData {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? parseProgress(JSON.parse(raw)) : createProgress();
  } catch {
    return createProgress();
  }
}

/** Dibaca sinkron dari LocalStorage saat boot; hydrateProgress() menyusul dengan IndexedDB. */
let current: ProgressData = readLocal();
let lastResult: LevelResult | null = null;
/** True setelah bonus koin dari iklan untuk hasil level terakhir sudah diambil. */
let bonusTaken = false;
let writeChain: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function persist(data: ProgressData): void {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {
    /* penyimpanan penuh atau diblokir: IndexedDB tetap dicoba */
  }
  writeChain = writeChain
    .then(() => idbSet(IDB_KEY, data))
    .then(
      () => undefined,
      () => undefined,
    );
}

function commit(next: ProgressData): void {
  current = { ...next, savedAt: Date.now() };
  persist(current);
  emit();
}

/** Memuat salinan IndexedDB dan memakainya jika lebih baru daripada salinan LocalStorage. */
export async function hydrateProgress(): Promise<void> {
  try {
    const stored = parseProgress(await idbGet(IDB_KEY));
    if (stored.savedAt > current.savedAt) {
      current = stored;
      emit();
    }
  } catch {
    /* IndexedDB tidak tersedia: tetap memakai LocalStorage */
  }
}

export function getProgress(): ProgressData {
  return current;
}

/** Hasil level kampanye yang baru saja selesai (untuk layar Level Complete). */
export function getLastResult(): LevelResult | null {
  return lastResult;
}

function finalize(
  before: ProgressData,
  after: ProgressData,
): { next: ProgressData; unlocked: string[]; levelUp: number | null } {
  const { next, unlocked } = unlockAchievements(after, Date.now());
  return { next, unlocked, levelUp: levelUpOf(before, next) };
}

/* ---------- Kampanye ---------- */

export function completeLevel(level: LevelDef, stats: RunStats): LevelResult {
  const { next, result } = applyCompletion(current, level, stats);
  const fin = finalize(current, next);
  commit(fin.next);
  lastResult = { ...result, unlocked: fin.unlocked, levelUp: fin.levelUp };
  bonusTaken = false;
  return lastResult;
}

/** True jika hasil level terakhir punya koin dan bonus iklan belum diambil. */
export function canClaimAdBonus(): boolean {
  return lastResult !== null && !bonusTaken && lastResult.coins > 0;
}

/**
 * Memberi bonus koin (sebesar koin level terakhir) setelah rewarded ad ditonton.
 * Hanya bisa diambil sekali per hasil level. Mengembalikan koin yang diberikan.
 */
export function claimAdBonus(): number {
  if (!lastResult || bonusTaken || lastResult.coins <= 0) return 0;
  bonusTaken = true;
  const coins = lastResult.coins;
  const fin = finalize(current, grant(current, coins, 0));
  commit(fin.next);
  return coins;
}

/* ---------- Tantangan ---------- */

export function completeDaily(
  dateKey: string,
  level: LevelDef,
  stats: RunStats,
): ChallengeResult {
  const stars = starsFromObjectives(evaluateObjectives(level, stats));
  const r = applyDaily(current, dateKey, stars);
  const fin = finalize(current, r.next);
  commit(fin.next);
  return {
    kind: "daily",
    coins: r.coins,
    xp: r.xp,
    stars,
    first: r.first,
    levelUp: fin.levelUp,
    unlocked: fin.unlocked,
    detail: r.first
      ? "Daily challenge complete!"
      : "Solved again. Rewards are given once per day.",
  };
}

export function completeEndlessRound(round: number): ChallengeResult {
  const r = applyEndlessRound(current, round);
  const fin = finalize(current, r.next);
  commit(fin.next);
  return {
    kind: "endless",
    coins: r.coins,
    xp: r.xp,
    stars: null,
    first: true,
    levelUp: fin.levelUp,
    unlocked: fin.unlocked,
    detail: `Round ${round} solved!`,
  };
}

export function completeTimeChallenge(elapsedSeconds: number): ChallengeResult {
  const r = applyTimeWin(current, elapsedSeconds);
  const fin = finalize(current, r.next);
  commit(fin.next);
  return {
    kind: "time",
    coins: r.coins,
    xp: r.xp,
    stars: null,
    first: true,
    levelUp: fin.levelUp,
    unlocked: fin.unlocked,
    detail: `Solved in ${Math.round(elapsedSeconds)} seconds!`,
  };
}

export function completeMinimumChallenge(): ChallengeResult {
  const r = applyMinimumWin(current);
  const fin = finalize(current, r.next);
  commit(fin.next);
  return {
    kind: "minimum",
    coins: r.coins,
    xp: r.xp,
    stars: null,
    first: true,
    levelUp: fin.levelUp,
    unlocked: fin.unlocked,
    detail: "Solved within the block limit!",
  };
}

export function claimWeeklyReward(week: string): boolean {
  const r = claimWeekly(current, week);
  if (!r.claimed) return false;
  const fin = finalize(current, r.next);
  commit(fin.next);
  return true;
}

/* ---------- Kosmetik ---------- */

export function purchaseCosmetic(id: string): { ok: boolean; reason?: string } {
  const r = buyItem(current, id);
  if (!r.ok) return { ok: false, reason: r.reason };
  const fin = finalize(current, r.next);
  commit(fin.next);
  return { ok: true };
}

export function equipCosmetic(id: string): boolean {
  const next = equipItem(current, id);
  if (!next) return false;
  commit(next);
  return true;
}

/** Mengosongkan progres di memori, LocalStorage, dan IndexedDB. */
export function resetProgressState(): void {
  current = createProgress();
  lastResult = null;
  bonusTaken = false;
  try {
    window.localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* diabaikan */
  }
  writeChain = writeChain
    .then(() => idbDelete(IDB_KEY))
    .then(
      () => undefined,
      () => undefined,
    );
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ProgressData {
  return current;
}

export function useProgress(): ProgressData {
  return useSyncExternalStore(subscribe, getSnapshot);
}