import { describe, expect, test } from "bun:test";
import { DEMO_LEVEL } from "@/data/demoLevel";
import { evaluateObjectives, starsFromObjectives } from "./objectives";
import type { LevelDef } from "./types";

const level: LevelDef = { ...DEMO_LEVEL, parCommands: 10, parSteps: 10 };

describe("objectives", () => {
  test("a perfect run earns three stars", () => {
    const objectives = evaluateObjectives(level, {
      blocks: 10,
      steps: 10,
      starsCollected: 1,
    });
    expect(starsFromObjectives(objectives)).toBe(3);
  });

  test("using too many blocks loses the efficiency star", () => {
    const objectives = evaluateObjectives(level, {
      blocks: 11,
      steps: 10,
      starsCollected: 1,
    });
    expect(starsFromObjectives(objectives)).toBe(2);
    expect(objectives.find((o) => o.id === "blocks")?.done).toBe(false);
  });

  test("missing a star loses the bonus on levels with stars", () => {
    const objectives = evaluateObjectives(level, {
      blocks: 10,
      steps: 10,
      starsCollected: 0,
    });
    expect(objectives.find((o) => o.id === "bonus")?.done).toBe(false);
  });

  test("levels without stars use the move count as the bonus", () => {
    const noStars: LevelDef = { ...level, objects: [], parSteps: 8 };
    const slow = evaluateObjectives(noStars, { blocks: 10, steps: 9, starsCollected: 0 });
    const quick = evaluateObjectives(noStars, { blocks: 10, steps: 8, starsCollected: 0 });
    expect(slow.find((o) => o.id === "bonus")?.done).toBe(false);
    expect(quick.find((o) => o.id === "bonus")?.done).toBe(true);
  });
});