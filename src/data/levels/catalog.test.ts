import { describe, expect, test } from "bun:test";
import { DEFAULT_LIMITS, validateProgram } from "@/engine/interpreter";
import { validateLevel } from "@/engine/level";
import { simulate } from "@/engine/simulate";
import { getLevelDef } from "../levelLookup";
import { buildCatalog } from "./catalog";

const entries = buildCatalog();

describe("level catalog", () => {
  test("has 75 levels with ids 1-1 to 5-15 in order", () => {
    const expected: string[] = [];
    for (let w = 1; w <= 5; w++) {
      for (let n = 1; n <= 15; n++) expected.push(`${w}-${n}`);
    }
    expect(entries.map((e) => e.level.id)).toEqual(expected);
  });

  test("no level had to use the fallback layout", () => {
    const fallbacks = entries.filter((e) => e.fallback).map((e) => e.level.id);
    expect(fallbacks).toEqual([]);
  });

  test("every level is valid and its reference solution completes it", () => {
    const problems: string[] = [];
    for (const { level, solution } of entries) {
      const issues = validateLevel(level);
      if (issues.length > 0) problems.push(`${level.id}: ${issues.join("; ")}`);

      const programIssues = validateProgram(
        solution.program,
        level.maxInstructions ?? DEFAULT_LIMITS.maxInstructions,
        solution.functions,
      );
      if (programIssues.length > 0) problems.push(`${level.id}: ${programIssues.join("; ")}`);

      const sim = simulate(level, solution);
      if (!sim.complete) problems.push(`${level.id}: ${sim.error ?? "not complete"}`);
      else if (sim.steps !== level.parSteps) problems.push(`${level.id}: parSteps mismatch`);
    }
    expect(problems).toEqual([]);
  });

  test("all 75 layouts are different", () => {
    const signatures = new Set(
      entries.map((e) =>
        JSON.stringify([
          e.level.rows,
          e.level.start,
          e.level.goal,
          e.level.startDir,
          e.level.objects,
        ]),
      ),
    );
    expect(signatures.size).toBe(75);
  });

  test("difficulty stays between 1 and 5 and grows inside each world", () => {
    for (let w = 1; w <= 5; w++) {
      const first = getLevelDef(`${w}-1`).difficulty ?? 0;
      const last = getLevelDef(`${w}-15`).difficulty ?? 0;
      expect(first).toBeGreaterThanOrEqual(1);
      expect(last).toBeLessThanOrEqual(5);
      expect(last).toBeGreaterThan(first);
    }
  });

  test("worlds 2 to 5 cannot be solved by typing every action one by one", () => {
    const problems: string[] = [];
    for (const { level } of entries) {
      const world = Number(level.id.split("-")[0]);
      if (world < 2) continue;
      if ((level.parSteps ?? 0) <= (level.maxInstructions ?? 0)) {
        problems.push(`${level.id}: ${level.parSteps} steps vs limit ${level.maxInstructions}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("each world offers the mechanic it teaches", () => {
    const problems: string[] = [];
    for (const { level } of entries) {
      const world = Number(level.id.split("-")[0]);
      const allowed = level.allowedCommands ?? [];
      if (world === 2 && !allowed.includes("repeat")) problems.push(level.id);
      if (world === 3 && !allowed.includes("if")) problems.push(level.id);
      if (world === 4 && !(allowed.includes("call") && (level.functions?.length ?? 0) > 0)) {
        problems.push(level.id);
      }
      if (world === 5 && !(allowed.includes("set") || allowed.includes("while"))) {
        problems.push(level.id);
      }
    }
    expect(problems).toEqual([]);
  });
});