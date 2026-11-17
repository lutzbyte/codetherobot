import { describe, expect, test } from "bun:test";
import { DEFAULT_LIMITS, validateProgram } from "@/engine/interpreter";
import { validateLevel } from "@/engine/level";
import { simulate } from "@/engine/simulate";
import type { LevelEntry } from "./families";
import {
  dailyEntry,
  endlessEntry,
  endlessParams,
  minimumEntry,
  timeEntry,
} from "./challengeLevels";

function problemsOf(entry: LevelEntry): string[] {
  const { level, solution } = entry;
  const problems: string[] = [];
  if (entry.fallback) problems.push(`${level.id}: fallback layout`);
  problems.push(...validateLevel(level).map((p) => `${level.id}: ${p}`));
  problems.push(
    ...validateProgram(
      solution.program,
      level.maxInstructions ?? DEFAULT_LIMITS.maxInstructions,
      solution.functions,
    ).map((p) => `${level.id}: ${p}`),
  );
  const sim = simulate(level, solution);
  if (!sim.complete) problems.push(`${level.id}: ${sim.error ?? "not complete"}`);
  return problems;
}

describe("challenge levels", () => {
  test("the daily level depends only on the date", () => {
    const a = JSON.stringify(dailyEntry("2026-11-14").level);
    expect(JSON.stringify(dailyEntry("2026-11-14").level)).toBe(a);
    expect(JSON.stringify(dailyEntry("2026-11-15").level)).not.toBe(a);
  });

  test("thirty days of daily levels are all solvable", () => {
    const problems: string[] = [];
    for (let day = 1; day <= 30; day++) {
      const key = `2026-11-${String(day).padStart(2, "0")}`;
      problems.push(...problemsOf(dailyEntry(key)));
    }
    expect(problems).toEqual([]);
  });

  test("endless rounds get harder and every round is solvable", () => {
    let previousWorld = 0;
    const problems: string[] = [];
    for (let round = 1; round <= 30; round++) {
      const { world } = endlessParams(round);
      expect(world).toBeGreaterThanOrEqual(previousWorld);
      previousWorld = world;
      problems.push(...problemsOf(endlessEntry(round, 12345)));
    }
    expect(problems).toEqual([]);
  });

  test("minimum challenge limits blocks to the par of the reference solution", () => {
    const problems: string[] = [];
    for (let seed = 0; seed < 10; seed++) {
      const entry = minimumEntry(seed);
      expect(entry.level.maxInstructions).toBe(entry.level.parCommands);
      problems.push(...problemsOf(entry));
    }
    expect(problems).toEqual([]);
  });

  test("time challenge levels are solvable", () => {
    const problems: string[] = [];
    for (let seed = 0; seed < 10; seed++) problems.push(...problemsOf(timeEntry(seed)));
    expect(problems).toEqual([]);
  });
});