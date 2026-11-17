import { describe, expect, test } from "bun:test";
import { DEMO_LEVEL } from "@/data/demoLevel";
import type { LevelDef } from "@/engine/types";
import {
  applyCompletion,
  createProgress,
  isLevelUnlocked,
  isWorldUnlocked,
  levelProgress,
  parseProgress,
  playerLevel,
} from "./progressLogic";

const level = (id: string): LevelDef => ({
  ...DEMO_LEVEL,
  id,
  parCommands: 10,
  parSteps: 10,
});

/** 1 bintang: blok melebihi par dan bintang peta tidak diambil. */
const ONE_STAR = { blocks: 99, steps: 99, starsCollected: 0 };
/** 2 bintang: blok sesuai par, bintang peta tidak diambil. */
const TWO_STARS = { blocks: 10, steps: 10, starsCollected: 0 };
/** 3 bintang. */
const THREE_STARS = { blocks: 10, steps: 10, starsCollected: 1 };

describe("progression", () => {
  test("first clear with two stars gives 30 coins and 50 xp", () => {
    const { next, result } = applyCompletion(createProgress(), level("1-1"), TWO_STARS);
    expect(result.stars).toBe(2);
    expect(result.coins).toBe(30);
    expect(result.xp).toBe(50);
    expect(next.levels["1-1"]?.stars).toBe(2);
    expect(next.coins).toBe(30);
    expect(next.coinsEarned).toBe(30);
  });

  test("replaying with fewer stars keeps the best record and gives no reward", () => {
    const first = applyCompletion(createProgress(), level("1-1"), THREE_STARS).next;
    const { next, result } = applyCompletion(first, level("1-1"), ONE_STAR);
    expect(result.coins).toBe(0);
    expect(next.levels["1-1"]?.stars).toBe(3);
    expect(next.levels["1-1"]?.efficient).toBe(true);
    expect(next.coins).toBe(first.coins);
  });

  test("improving a record rewards only the extra stars", () => {
    const first = applyCompletion(createProgress(), level("1-1"), ONE_STAR).next;
    const { result } = applyCompletion(first, level("1-1"), THREE_STARS);
    expect(result.improved).toBe(true);
    expect(result.coins).toBe(20);
  });

  test("levels unlock one after another", () => {
    const empty = createProgress();
    expect(isLevelUnlocked(empty, "1-1", false)).toBe(true);
    expect(isLevelUnlocked(empty, "1-2", false)).toBe(false);
    const done = applyCompletion(empty, level("1-1"), ONE_STAR).next;
    expect(isLevelUnlocked(done, "1-2", false)).toBe(true);
    expect(isLevelUnlocked(done, "1-3", false)).toBe(false);
  });

  test("a world unlocks after ten levels of the previous world", () => {
    let data = createProgress();
    for (let n = 1; n <= 9; n++) {
      data = applyCompletion(data, level(`1-${n}`), ONE_STAR).next;
    }
    expect(isWorldUnlocked(data, 2, false)).toBe(false);
    data = applyCompletion(data, level("1-10"), ONE_STAR).next;
    expect(isWorldUnlocked(data, 2, false)).toBe(true);
    expect(isLevelUnlocked(data, "2-1", false)).toBe(true);
  });

  test("unlock-all bypasses every lock", () => {
    const empty = createProgress();
    expect(isLevelUnlocked(empty, "5-15", true)).toBe(true);
    expect(isWorldUnlocked(empty, 5, true)).toBe(true);
    expect(isLevelUnlocked(empty, "9-99", true)).toBe(false);
  });

  test("corrupted saved data falls back to empty progress, version 1 is migrated", () => {
    expect(parseProgress({ version: 3 })).toEqual(createProgress());
    expect(parseProgress("nonsense")).toEqual(createProgress());

    const migrated = parseProgress({
      version: 1,
      xp: 5,
      coins: 7,
      levels: {
        "1-1": { stars: 2, bestBlocks: 3, bestSteps: 4 },
        "1-2": { stars: 9, bestBlocks: 3, bestSteps: 4 },
        bad: { stars: 1, bestBlocks: 1, bestSteps: 1 },
      },
    });
    expect(Object.keys(migrated.levels)).toEqual(["1-1"]);
    expect(migrated.levels["1-1"]?.efficient).toBe(false);
    expect(migrated.coins).toBe(7);
    expect(migrated.version).toBe(2);
    expect(migrated.equipped.skin).toBe("skin:classic");
  });

  test("saved data survives a JSON round trip", () => {
    const { next } = applyCompletion(createProgress(), level("1-1"), THREE_STARS);
    const data = { ...next, owned: ["skin:plum"], savedAt: 123 };
    expect(parseProgress(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });

  test("player level grows with xp", () => {
    expect(playerLevel(0)).toBe(1);
    expect(playerLevel(99)).toBe(1);
    expect(playerLevel(100)).toBe(2);
    expect(playerLevel(300)).toBe(3);
    expect(levelProgress(150)).toEqual({ level: 2, current: 50, needed: 200 });
  });
});