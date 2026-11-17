import { describe, expect, test } from "bun:test";
import { buildCatalog } from "@/data/levels/catalog";
import { countAll } from "@/engine/editor";
import { evaluateObjectives, starsFromObjectives } from "@/engine/objectives";
import { ProgramRunner } from "@/engine/runner";
import type { ActionPort } from "@/engine/runner";
import { simulate } from "@/engine/simulate";
import { WorldState } from "@/engine/world";
import { unlockAchievements } from "@/progress/achievements";
import {
  applyCompletion,
  createProgress,
  isLevelUnlocked,
  levelsDone,
  totalStars,
} from "@/progress/progressLogic";

const entries = buildCatalog();

function portFor(world: WorldState): ActionPort {
  return {
    async perform(action) {
      return { ok: true, result: world.apply(action) };
    },
    async reset() {
      world.reset();
      return { ok: true, result: null };
    },
  };
}

describe("full campaign", () => {
  test("every reference solution runs through the real runner and earns three stars", async () => {
    const problems: string[] = [];
    for (const { level, solution } of entries) {
      const world = new WorldState(level);
      const runner = new ProgramRunner(portFor(world));
      await runner.run(solution.program, {
        level,
        functions: solution.functions,
        maxInstructions: level.maxInstructions,
      });

      const state = runner.getState();
      if (state.status !== "complete") {
        problems.push(`${level.id}: ${state.status} (${state.message})`);
        continue;
      }
      const objectives = evaluateObjectives(level, {
        blocks: countAll(solution),
        steps: state.stepsExecuted,
        starsCollected: world.starsCollected(),
      });
      const stars = starsFromObjectives(objectives);
      if (stars !== 3) problems.push(`${level.id}: ${stars} stars`);
    }
    expect(problems).toEqual([]);
  });

  test("playing the whole campaign in order unlocks every level and the expected achievements", () => {
    let data = createProgress();
    const problems: string[] = [];

    for (const { level, solution } of entries) {
      if (!isLevelUnlocked(data, level.id, false)) problems.push(`${level.id} is locked`);
      const sim = simulate(level, solution);
      const { next } = applyCompletion(data, level, {
        blocks: countAll(solution),
        steps: sim.steps,
        starsCollected: sim.starsCollected,
      });
      data = unlockAchievements(next, 1).next;
    }

    expect(problems).toEqual([]);
    expect(totalStars(data)).toBe(225);
    for (let world = 1; world <= 5; world++) {
      expect(levelsDone(data, world)).toBe(15);
    }
    for (const id of [
      "first-steps",
      "world-1",
      "world-2",
      "world-3",
      "world-4",
      "world-5",
      "stars-25",
      "stars-75",
      "perfect",
      "efficient",
      "coins-500",
      "level-5",
    ]) {
      expect(data.achievements[id]).toBeDefined();
    }
  });
});