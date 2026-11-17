import { describe, expect, test } from "bun:test";
import { DEMO_LEVEL } from "@/data/demoLevel";
import { act } from "./builders";
import type { Program } from "./program";
import { simulate } from "./simulate";
import type { RobotAction } from "./types";

const toProgram = (actions: RobotAction[]): Program =>
  actions.map((action, i) => act(i + 1, action));

describe("simulate", () => {
  test("completes the demo level and counts steps and stars", () => {
    const program = toProgram([
      "forward",
      "forward",
      "forward",
      "right",
      "forward",
      "collect",
      "forward",
      "left",
      "forward",
      "forward",
    ]);
    const result = simulate(DEMO_LEVEL, { program, functions: [] });
    expect(result.complete).toBe(true);
    expect(result.steps).toBe(10);
    expect(result.starsCollected).toBe(1);
  });

  test("reports a blocked move", () => {
    const result = simulate(DEMO_LEVEL, {
      program: toProgram(["left", "forward"]),
      functions: [],
    });
    expect(result.complete).toBe(false);
    expect(result.error).toContain("blocked");
  });

  test("reports a program that ends before the goal", () => {
    const result = simulate(DEMO_LEVEL, {
      program: toProgram(["forward"]),
      functions: [],
    });
    expect(result.complete).toBe(false);
    expect(result.error).toContain("ended");
  });
});