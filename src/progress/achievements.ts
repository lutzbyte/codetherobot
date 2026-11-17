import type { IconName } from "@/components/ui/Icon";
import { WORLDS } from "@/data/uiData";
import { longestStreak } from "./challenges";
import {
  WORLD_UNLOCK_REQUIREMENT,
  efficientLevels,
  grant,
  levelsCompleted,
  levelsDone,
  perfectLevels,
  playerLevel,
  totalStars,
} from "./progressLogic";
import type { ProgressData } from "./progressLogic";

export interface AchievementDef {
  id: string;
  title: string;
  detail: string;
  icon: IconName;
  target: number;
  /** Hadiah koin saat terbuka. */
  reward: number;
  progress: (data: ProgressData) => number;
}

const WORLD_DEFS: AchievementDef[] = WORLDS.map((world): AchievementDef =>
  world.id === 1
    ? {
        id: "world-1",
        title: "Explorer",
        detail: "Finish every level in First Steps.",
        icon: "worlds",
        target: 15,
        reward: 30,
        progress: (data) => levelsDone(data, 1),
      }
    : {
        id: `world-${world.id}`,
        title: `${world.title} Pro`,
        detail: `Complete ${WORLD_UNLOCK_REQUIREMENT} levels of ${world.title}.`,
        icon: "worlds",
        target: WORLD_UNLOCK_REQUIREMENT,
        reward: 20 + 10 * world.id,
        progress: (data) => levelsDone(data, world.id),
      },
);

export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  {
    id: "first-steps",
    title: "First Steps",
    detail: "Complete your first level.",
    icon: "flag",
    target: 1,
    reward: 10,
    progress: levelsCompleted,
  },
  ...WORLD_DEFS,
  {
    id: "stars-25",
    title: "Star Collector",
    detail: "Earn 25 stars.",
    icon: "star",
    target: 25,
    reward: 30,
    progress: totalStars,
  },
  {
    id: "stars-75",
    title: "Star Hoarder",
    detail: "Earn 75 stars.",
    icon: "star",
    target: 75,
    reward: 80,
    progress: totalStars,
  },
  {
    id: "perfect",
    title: "Perfectionist",
    detail: "Get 3 stars on 10 levels.",
    icon: "trophy",
    target: 10,
    reward: 60,
    progress: perfectLevels,
  },
  {
    id: "efficient",
    title: "Minimalist",
    detail: "Solve 10 levels with the par number of blocks or fewer.",
    icon: "diamond",
    target: 10,
    reward: 50,
    progress: efficientLevels,
  },
  {
    id: "daily-3",
    title: "Daily Habit",
    detail: "Complete the daily challenge on 3 different days.",
    icon: "code",
    target: 3,
    reward: 30,
    progress: (data) => Object.keys(data.dailyDone).length,
  },
  {
    id: "streak-7",
    title: "Week Streak",
    detail: "Complete the daily challenge 7 days in a row.",
    icon: "code",
    target: 7,
    reward: 100,
    progress: (data) => longestStreak(Object.keys(data.dailyDone)),
  },
  {
    id: "endless-5",
    title: "Endless Explorer",
    detail: "Reach round 5 in Endless Puzzle.",
    icon: "repeat",
    target: 5,
    reward: 40,
    progress: (data) => data.modes.endlessBest,
  },
  {
    id: "speedster",
    title: "Speedster",
    detail: "Win a Time Challenge.",
    icon: "clock",
    target: 1,
    reward: 40,
    progress: (data) => data.modes.timeWins,
  },
  {
    id: "coins-500",
    title: "Coin Collector",
    detail: "Earn 500 coins in total.",
    icon: "coin",
    target: 500,
    reward: 50,
    progress: (data) => data.coinsEarned,
  },
  {
    id: "level-5",
    title: "Rising Star",
    detail: "Reach player level 5.",
    icon: "trophy",
    target: 5,
    reward: 60,
    progress: (data) => playerLevel(data.xp),
  },
  {
    id: "stylist",
    title: "Stylist",
    detail: "Buy 3 cosmetics for your robot.",
    icon: "paint",
    target: 3,
    reward: 30,
    progress: (data) => data.owned.length,
  },
];

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_DEFS.find((def) => def.id === id);
}

export function achievementTitle(id: string): string {
  return achievementById(id)?.title ?? id;
}

/** Achievement yang syaratnya terpenuhi tetapi belum dibuka. */
export function pendingAchievements(data: ProgressData): string[] {
  return ACHIEVEMENT_DEFS.filter(
    (def) => data.achievements[def.id] === undefined && def.progress(data) >= def.target,
  ).map((def) => def.id);
}

/**
 * Membuka semua achievement yang terpenuhi dan memberi hadiah koinnya.
 * Diulang karena koin hadiah bisa memenuhi achievement lain.
 */
export function unlockAchievements(
  data: ProgressData,
  now: number,
): { next: ProgressData; unlocked: string[] } {
  let current = data;
  const unlocked: string[] = [];

  for (let pass = 0; pass < 5; pass++) {
    const pending = pendingAchievements(current);
    if (pending.length === 0) break;

    const achievements = { ...current.achievements };
    let coins = 0;
    for (const id of pending) {
      achievements[id] = now;
      coins += achievementById(id)?.reward ?? 0;
    }
    current = grant({ ...current, achievements }, coins, 0);
    unlocked.push(...pending);
  }

  return { next: current, unlocked };
}