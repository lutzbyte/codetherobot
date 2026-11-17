import { describe, expect, test } from "bun:test";
import { DEMO_LEVEL } from "@/data/demoLevel";
import {
  ACHIEVEMENT_DEFS,
  pendingAchievements,
  unlockAchievements,
} from "./achievements";
import { applyCompletion, createProgress } from "./progressLogic";
import type { LevelRecord, ProgressData } from "./progressLogic";

function withLevels(entries: Record<string, number>): ProgressData {
  const levels: Record<string, LevelRecord> = {};
  for (const [id, stars] of Object.entries(entries)) {
    levels[id] = { stars, bestBlocks: 5, bestSteps: 5, efficient: false };
  }
  return { ...createProgress(), levels };
}

describe("achievements", () => {
  test("ids are unique", () => {
    const ids = ACHIEVEMENT_DEFS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("first-steps unlocks after the first level and pays its reward", () => {
    const done = applyCompletion(
      createProgress(),
      { ...DEMO_LEVEL, id: "1-1" },
      { blocks: 99, steps: 99, starsCollected: 0 },
    ).next;
    expect(pendingAchievements(done)).toContain("first-steps");

    const { next, unlocked } = unlockAchievements(done, 1000);
    expect(unlocked).toContain("first-steps");
    expect(next.achievements["first-steps"]).toBe(1000);
    expect(next.coins).toBeGreaterThanOrEqual(done.coins + 10);
  });

  test("an unlocked achievement is never unlocked twice", () => {
    const data = withLevels({ "1-1": 1 });
    const first = unlockAchievements(data, 1);
    const second = unlockAchievements(first.next, 2);
    expect(second.unlocked).toEqual([]);
    expect(second.next.coins).toBe(first.next.coins);
  });

  test("star and world achievements follow real progress", () => {
    const entries: Record<string, number> = {};
    for (let n = 1; n <= 9; n++) entries[`2-${n}`] = 3;
    const nine = withLevels(entries);
    expect(pendingAchievements(nine)).toContain("stars-25");
    expect(pendingAchievements(nine)).not.toContain("world-2");

    entries["2-10"] = 3;
    expect(pendingAchievements(withLevels(entries))).toContain("world-2");
  });
});