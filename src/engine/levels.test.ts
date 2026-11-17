import { describe, expect, test } from "bun:test";
import { TUTORIAL_LEVELS } from "@/data/tutorialLevels";
import {
  act,
  call,
  cond,
  ifElse,
  rep,
  sensor,
  setVar,
  vr,
  when,
  whileDo,
} from "./builders";
import { validateLevel } from "./level";
import type { FunctionDef, Program } from "./program";
import type { ActionPort } from "./runner";
import { ProgramRunner } from "./runner";
import type { LevelDef } from "./types";
import { WorldState } from "./world";

interface Solution {
  program: Program;
  functions?: FunctionDef[];
}

const SOLUTIONS: Record<string, Solution> = {
  "2-1": { program: [rep(1, 7, [act(2, "forward")])] },
  "2-2": {
    program: [rep(1, 3, [rep(2, 3, [act(3, "forward")]), act(4, "right")])],
  },
  "3-1": {
    program: [
      rep(1, 9, [
        ifElse(2, when(sensor("pathAhead")), [act(3, "forward")], [act(4, "right")]),
      ]),
    ],
  },
  "3-2": {
    program: [
      rep(1, 11, [
        ifElse(
          2,
          when(sensor("pathAhead")),
          [act(3, "forward")],
          [ifElse(4, when(sensor("pathRight")), [act(5, "right")], [act(6, "left")])],
        ),
      ]),
    ],
  },
  "4-1": {
    program: [
      call(1, "f1"),
      act(2, "right"),
      call(3, "f1"),
      act(4, "left"),
      call(5, "f1"),
      act(6, "right"),
      call(7, "f1"),
    ],
    functions: [
      {
        id: "f1",
        params: [],
        body: [act(8, "forward"), act(9, "forward"), act(10, "forward")],
      },
    ],
  },
  "4-2": {
    program: [
      call(1, "f1", [2]),
      act(2, "right"),
      call(3, "f1", [3]),
      act(4, "left"),
      call(5, "f1", [4]),
    ],
    functions: [
      { id: "f1", params: ["n"], body: [rep(6, vr("n"), [act(7, "forward")])] },
    ],
  },
  "5-1": {
    program: [
      setVar(1, "size", "set", 1),
      rep(2, 4, [
        rep(3, vr("size"), [act(4, "forward")]),
        act(5, "right"),
        setVar(6, "size", "add", 1),
      ]),
    ],
  },
  "5-2": {
    program: [
      whileDo(
        1,
        cond("and", sensor("pathAhead"), sensor("switchHere", true)),
        [act(2, "forward")],
      ),
      act(3, "interact"),
      whileDo(4, when(sensor("pathAhead")), [act(5, "forward")]),
    ],
  },
};

function worldPort(world: WorldState): ActionPort {
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

async function solve(level: LevelDef, solution: Solution) {
  const runner = new ProgramRunner(worldPort(new WorldState(level)));
  await runner.run(solution.program, {
    level,
    functions: solution.functions ?? [],
    maxInstructions: level.maxInstructions,
  });
  return runner.getState();
}

describe("tutorial levels", () => {
  for (const [id, solution] of Object.entries(SOLUTIONS)) {
    test(`level ${id} is valid and its solution completes it`, async () => {
      const level = TUTORIAL_LEVELS[id];
      if (!level) throw new Error(`missing level ${id}`);
      expect(validateLevel(level)).toEqual([]);

      const state = await solve(level, solution);
      expect(state.message).toBe("Goal reached!");
      expect(state.status).toBe("complete");
    });
  }
});