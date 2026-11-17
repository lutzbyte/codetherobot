import { describe, expect, test } from "bun:test";
import { DEMO_LEVEL } from "@/data/demoLevel";
import { TUTORIAL_LEVELS } from "@/data/tutorialLevels";
import {
  act,
  call,
  compare,
  cond,
  ifElse,
  num,
  rep,
  sensor,
  setVar,
  vr,
  when,
  whileDo,
} from "./builders";
import type { ExecEnv } from "./interpreter";
import {
  DEFAULT_LIMITS,
  ExecutionLimitError,
  executeProgram,
  validateProgram,
} from "./interpreter";
import type { FunctionDef, Program } from "./program";
import { WorldState } from "./world";

const simple: Program = [act(1, "forward"), act(2, "left"), act(3, "wait")];

function actionsOf(
  program: Program,
  env: ExecEnv = {},
): string[] {
  return [...executeProgram(program, {}, env)].map((s) => s.action);
}

describe("executeProgram basics", () => {
  test("yields steps in order with instruction ids", () => {
    const steps = [...executeProgram(simple)];
    expect(steps.map((s) => s.action)).toEqual(["forward", "left", "wait"]);
    expect(steps.map((s) => s.instructionId)).toEqual([1, 2, 3]);
  });

  test("throws when the step limit is exceeded", () => {
    const gen = executeProgram(simple, { maxSteps: 2 });
    gen.next();
    gen.next();
    expect(() => gen.next()).toThrow(ExecutionLimitError);
  });
});

describe("validateProgram", () => {
  test("rejects an empty program", () => {
    expect(validateProgram([], DEFAULT_LIMITS.maxInstructions).length).toBe(1);
  });

  test("rejects a program that is too long", () => {
    expect(validateProgram(simple, 2).length).toBeGreaterThan(0);
  });

  test("rejects unknown commands", () => {
    const bad = [{ kind: "action", id: 1, action: "teleport" }] as unknown as Program;
    expect(validateProgram(bad, 10).length).toBeGreaterThan(0);
  });

  test("rejects blocks with an empty body", () => {
    expect(validateProgram([rep(1, 2, [])], 10).length).toBeGreaterThan(0);
  });

  test("checks function calls", () => {
    expect(validateProgram([call(1, "f9")], 10).join(" ")).toContain("Unknown function");

    const functions: FunctionDef[] = [
      { id: "f1", params: [], body: [act(2, "wait")] },
    ];
    const errors = validateProgram([call(1, "f1", [2])], 10, functions);
    expect(errors.join(" ")).toContain("needs 0");
  });
});

describe("loops", () => {
  test("repeat expands its body", () => {
    expect(actionsOf([rep(1, 3, [act(2, "forward")])])).toEqual([
      "forward",
      "forward",
      "forward",
    ]);
  });

  test("nested loops multiply", () => {
    const program = [rep(1, 2, [rep(2, 3, [act(3, "forward")])])];
    expect(actionsOf(program).length).toBe(6);
  });

  test("a loop with actions stops at the step limit", () => {
    const program = [whileDo(1, when(compare(0, "==", 0)), [act(2, "wait")])];
    expect(() => {
      for (const _step of executeProgram(program)) {
        /* menghabiskan generator */
      }
    }).toThrow(ExecutionLimitError);
  });

  test("a loop without actions stops at the tick limit", () => {
    const program = [
      whileDo(1, when(compare(0, "==", 0)), [setVar(2, "count", "add", 1)]),
    ];
    expect(() => {
      for (const _step of executeProgram(program)) {
        /* menghabiskan generator */
      }
    }).toThrow(ExecutionLimitError);
  });
});

describe("conditions and sensors", () => {
  test("if / else picks a branch from a sensor", () => {
    const program = [
      ifElse(1, when(sensor("pathAhead")), [act(2, "forward")], [act(3, "left")]),
    ];
    const clear = new WorldState(DEMO_LEVEL);
    expect(actionsOf(program, { world: clear })).toEqual(["forward"]);

    const blocked = new WorldState(DEMO_LEVEL);
    blocked.apply("left");
    expect(actionsOf(program, { world: blocked })).toEqual(["left"]);
  });

  test("while with an and / not condition walks to the switch", () => {
    const level = TUTORIAL_LEVELS["5-2"];
    if (!level) throw new Error("missing level 5-2");
    const program = [
      whileDo(
        1,
        cond("and", sensor("pathAhead"), sensor("switchHere", true)),
        [act(2, "forward")],
      ),
    ];
    expect(actionsOf(program, { world: new WorldState(level) })).toEqual([
      "forward",
      "forward",
      "forward",
    ]);
  });

  test("conditions can compare variables", () => {
    const program = [
      setVar(1, "count", "set", 2),
      ifElse(2, when(compare(vr("count"), ">", 1)), [act(3, "forward")], [act(4, "left")]),
    ];
    expect(actionsOf(program)).toEqual(["forward"]);
  });
});

describe("functions and variables", () => {
  test("parameters change how a function runs", () => {
    const functions: FunctionDef[] = [
      { id: "f1", params: ["n"], body: [rep(10, vr("n"), [act(11, "forward")])] },
    ];
    expect(actionsOf([call(1, "f1", [3])], { functions })).toEqual([
      "forward",
      "forward",
      "forward",
    ]);
  });

  test("variables can be set, changed and used as a count", () => {
    const program = [
      setVar(1, "count", "set", 2),
      setVar(2, "count", "add", 1),
      rep(3, vr("count"), [act(4, "wait")]),
    ];
    expect(actionsOf(program)).toEqual(["wait", "wait", "wait"]);
  });

  test("runaway recursion stops at the depth limit", () => {
    const functions: FunctionDef[] = [
      { id: "f1", params: [], body: [call(1, "f1")] },
    ];
    expect(() => [...executeProgram([call(2, "f1")], {}, { functions })]).toThrow(
      ExecutionLimitError,
    );
  });
});