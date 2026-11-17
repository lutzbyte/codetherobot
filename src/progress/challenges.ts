import { grant } from "./progressLogic";
import type { ProgressData } from "./progressLogic";

export const WEEKLY_TARGET = 5;
export const WEEKLY_REWARD = { coins: 100, xp: 100 };
export const TIME_LIMIT_SECONDS = 150;

/* ---------- Tanggal ---------- */

/** Tanggal lokal sebagai "YYYY-MM-DD". */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function shiftDate(key: string, days: number): string {
  const date = parseDateKey(key);
  if (!date) return key;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Kunci minggu ISO, misalnya "2026-W46". Minggu dimulai hari Senin. */
export function weekKeyOf(key: string): string {
  const date = parseDateKey(key);
  if (!date) return "";
  const weekday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - weekday + 3);
  const isoYear = date.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - jan4.getTime()) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7,
    );
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** Streak hari berturut-turut yang berakhir hari ini, atau kemarin jika hari ini belum dikerjakan. */
export function dailyStreak(dates: readonly string[], today: string): number {
  const done = new Set(dates);
  let cursor = done.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (done.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

export function longestStreak(dates: readonly string[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of sorted) {
    run = previous !== null && shiftDate(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

/* ---------- Daily dan weekly ---------- */

export function applyDaily(
  data: ProgressData,
  key: string,
  stars: number,
): { next: ProgressData; coins: number; xp: number; first: boolean } {
  const previous = data.dailyDone[key];
  const first = previous === undefined;
  const reward = first ? { coins: 40 + 10 * stars, xp: 40 } : { coins: 0, xp: 0 };
  const dailyDone = { ...data.dailyDone, [key]: Math.max(stars, previous ?? 0) };
  return {
    next: grant({ ...data, dailyDone }, reward.coins, reward.xp),
    coins: reward.coins,
    xp: reward.xp,
    first,
  };
}

/** Jumlah hari dalam minggu tertentu yang daily-nya sudah selesai. */
export function weeklyDone(data: ProgressData, week: string): number {
  return Object.keys(data.dailyDone).filter((key) => weekKeyOf(key) === week).length;
}

export function claimWeekly(
  data: ProgressData,
  week: string,
): { next: ProgressData; claimed: boolean } {
  if (data.weeklyClaimed[week] === true || weeklyDone(data, week) < WEEKLY_TARGET) {
    return { next: data, claimed: false };
  }
  const marked = { ...data, weeklyClaimed: { ...data.weeklyClaimed, [week]: true } };
  return {
    next: grant(marked, WEEKLY_REWARD.coins, WEEKLY_REWARD.xp),
    claimed: true,
  };
}

/* ---------- Mode tambahan ---------- */

export function endlessReward(round: number): { coins: number; xp: number } {
  return { coins: 5 + 2 * round, xp: 10 + 2 * round };
}

export function applyEndlessRound(
  data: ProgressData,
  round: number,
): { next: ProgressData; coins: number; xp: number } {
  const reward = endlessReward(round);
  const modes = { ...data.modes, endlessBest: Math.max(data.modes.endlessBest, round) };
  return { next: grant({ ...data, modes }, reward.coins, reward.xp), ...reward };
}

export function applyTimeWin(
  data: ProgressData,
  elapsedSeconds: number,
): { next: ProgressData; coins: number; xp: number } {
  const elapsed = Math.round(elapsedSeconds);
  const remaining = Math.max(0, TIME_LIMIT_SECONDS - elapsed);
  const reward = { coins: 20 + Math.floor(remaining / 5), xp: 30 };
  const modes = {
    ...data.modes,
    timeWins: data.modes.timeWins + 1,
    timeBest:
      data.modes.timeBest === null ? elapsed : Math.min(data.modes.timeBest, elapsed),
  };
  return { next: grant({ ...data, modes }, reward.coins, reward.xp), ...reward };
}

export function applyMinimumWin(
  data: ProgressData,
): { next: ProgressData; coins: number; xp: number } {
  const reward = { coins: 30, xp: 40 };
  const modes = { ...data.modes, minimumSolved: data.modes.minimumSolved + 1 };
  return { next: grant({ ...data, modes }, reward.coins, reward.xp), ...reward };
}