import { describe, expect, test } from "bun:test";
import { DEMO_LEVEL } from "@/data/demoLevel";
import { act, compare, ifElse, sensor, when, whileDo } from "./builders";
import type { Program } from "./program";
import type { ActionPort } from "./runner";
import { ProgramRunner } from "./runner";
import type { RobotAction } from "./types";
import { WorldState } from "./world";

const toProgram = (actions: RobotAction[]): Program =>
  actions.map((action, i) => act(i + 1, action));

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

/** Port yang menahan setiap aksi sampai gate dilepas, untuk menguji pause dan reset. */
function gatedPort() {
  const gates: Array<() => void> = [];
  const port: ActionPort = {
    perform() {
      return new Promise((resolve) => {
        gates.push(() => resolve({ ok: true, result: null }));
      });
    },
    async reset() {
      return { ok: true, result: null };
    },
  };
  return { port, gates };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("ProgramRunner", () => {
  test("runs the demo solution to completion", async () => {
    const runner = new ProgramRunner(worldPort(new WorldState(DEMO_LEVEL)));
    await runner.run(toProgram(SOLUTION));
    expect(runner.getState().status).toBe("complete");
    expect(runner.getState().stepsExecuted).toBe(10);
  });

  test("fails with a clear message when the robot is blocked", async () => {
    const runner = new ProgramRunner(worldPort(new WorldState(DEMO_LEVEL)));
    await runner.run(toProgram(["left", "forward"]));
    const state = runner.getState();
    expect(state.status).toBe("failed");
    expect(state.message).toContain("island");
  });

  test("finishes when the program ends before the goal", async () => {
    const runner = new ProgramRunner(worldPort(new WorldState(DEMO_LEVEL)));
    await runner.run(toProgram(["forward"]));
    expect(runner.getState().status).toBe("finished");
  });

  test("rejects an empty program", async () => {
    const runner = new ProgramRunner(worldPort(new WorldState(DEMO_LEVEL)));
    await runner.run([]);
    expect(runner.getState().status).toBe("failed");
  });

  test("step executes one instruction at a time", async () => {
    const runner = new ProgramRunner(worldPort(new WorldState(DEMO_LEVEL)));
    const program = toProgram(["forward", "forward"]);

    await runner.step(program);
    expect(runner.getState().status).toBe("paused");
    expect(runner.getState().stepsExecuted).toBe(1);

    await runner.step(program);
    expect(runner.getState().stepsExecuted).toBe(2);

    await runner.step(program);
    expect(runner.getState().status).toBe("finished");
  });

  test("pause stops after the current step and resume continues", async () => {
    const { port, gates } = gatedPort();
    const runner = new ProgramRunner(port);
    const program = toProgram(["left", "right", "wait"]);

    const running = runner.run(program);
    await flush();
    expect(gates.length).toBe(1);

    runner.pause();
    gates.shift()?.();
    await running;
    await flush();
    expect(runner.getState().status).toBe("paused");
    expect(runner.getState().stepsExecuted).toBe(1);
    expect(gates.length).toBe(0);

    runner.resume();
    await flush();
    expect(gates.length).toBe(1);
    gates.shift()?.();
    await flush();
    expect(gates.length).toBe(1);
    gates.shift()?.();
    await flush();

    expect(runner.getState().status).toBe("finished");
    expect(runner.getState().stepsExecuted).toBe(3);
  });

  test("reset aborts a running program", async () => {
    const { port, gates } = gatedPort();
    const runner = new ProgramRunner(port);

    const running = runner.run(toProgram(["left", "right"]));
    await flush();
    await runner.reset();
    gates.shift()?.();
    await running;
    await flush();

    expect(runner.getState().status).toBe("idle");
    expect(gates.length).toBe(0);
  });

  test("an endless loop fails with a step-limit message", async () => {
    const runner = new ProgramRunner(worldPort(new WorldState(DEMO_LEVEL)));
    const program = [whileDo(1, when(compare(0, "==", 0)), [act(2, "wait")])];
    await runner.run(program, { level: DEMO_LEVEL });
    expect(runner.getState().status).toBe("failed");
    expect(runner.getState().message).toContain("step limit");
  });

  test("sensors read the mirrored world", async () => {
    const runner = new ProgramRunner(worldPort(new WorldState(DEMO_LEVEL)));
    const program = [
      ifElse(1, when(sensor("pathAhead")), [act(2, "forward")], [act(3, "left")]),
    ];
    await runner.run(program, { level: DEMO_LEVEL });
    expect(runner.getState().status).toBe("finished");
    expect(runner.getState().stepsExecuted).toBe(1);
  });
});