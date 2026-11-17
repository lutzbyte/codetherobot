import { describe, expect, test } from "bun:test";
import { DEMO_LEVEL } from "@/data/demoLevel";
import { validateLevel } from "./level";
import type { LevelDef, RobotAction } from "./types";
import { WorldState } from "./world";

function run(world: WorldState, actions: RobotAction[]) {
  return actions.map((a) => world.apply(a));
}

const SOLUTION: RobotAction[] = [
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
];

const GATE_LEVEL: LevelDef = {
  id: "gate",
  name: "Gate",
  rows: ["pppp"],
  start: { r: 0, c: 0 },
  startDir: 1,
  goal: { r: 0, c: 3 },
  objects: [
    { id: "sw", kind: "switch", at: { r: 0, c: 1 }, linkedTo: "g1" },
    { id: "g1", kind: "gate", at: { r: 0, c: 2 } },
  ],
  parCommands: 5,
};

describe("demo level", () => {
  test("is valid", () => {
    expect(validateLevel(DEMO_LEVEL)).toEqual([]);
  });

  test("known solution completes the level and collects the star", () => {
    const world = new WorldState(DEMO_LEVEL);
    const results = run(world, SOLUTION);
    const last = results[results.length - 1];
    expect(results.every((r) => r.ok)).toBe(true);
    expect(last?.complete).toBe(true);
    expect(last?.snapshot.collected).toEqual(["star-1"]);
  });

  test("is not complete before reaching the goal", () => {
    const world = new WorldState(DEMO_LEVEL);
    const results = run(world, SOLUTION.slice(0, 9));
    expect(results[results.length - 1]?.complete).toBe(false);
  });

  test("blocks at the island edge without moving", () => {
    const world = new WorldState(DEMO_LEVEL);
    world.apply("left");
    const result = world.apply("forward");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("edge");
    expect(result.snapshot.pos).toEqual({ r: 5, c: 1 });
  });

  test("blocks on obstacles", () => {
    const world = new WorldState(DEMO_LEVEL);
    run(world, ["forward", "forward", "forward", "right", "forward", "left"]);
    const result = world.apply("forward");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("obstacle");
  });

  test("turning wraps around", () => {
    const world = new WorldState(DEMO_LEVEL);
    expect(world.apply("left").snapshot.dir).toBe(3);
    expect(world.apply("right").snapshot.dir).toBe(0);
  });

  test("collect with nothing here is a harmless no-op", () => {
    const world = new WorldState(DEMO_LEVEL);
    const result = world.apply("collect");
    expect(result.ok).toBe(true);
    expect(result.collectedId).toBeUndefined();
  });

  test("reset restores the start state", () => {
    const world = new WorldState(DEMO_LEVEL);
    run(world, SOLUTION);
    world.reset();
    const snap = world.snapshot();
    expect(snap.pos).toEqual({ r: 5, c: 1 });
    expect(snap.dir).toBe(0);
    expect(snap.collected).toEqual([]);
  });
});

describe("gates and switches", () => {
  test("gate blocks until the switch is used", () => {
    const world = new WorldState(GATE_LEVEL);
    const results = run(world, [
      "forward",
      "forward",
      "interact",
      "forward",
      "forward",
    ]);
    expect(results[1]?.ok).toBe(false);
    expect(results[1]?.reason).toBe("gate");
    expect(results[2]?.toggledGateIds).toEqual(["g1"]);
    expect(results[4]?.complete).toBe(true);
  });
});

describe("validateLevel", () => {
  test("reports a start on an empty tile", () => {
    const bad: LevelDef = { ...GATE_LEVEL, rows: [".ppp"] };
    expect(validateLevel(bad).length).toBeGreaterThan(0);
  });
});