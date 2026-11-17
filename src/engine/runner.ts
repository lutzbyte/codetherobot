import {
  DEFAULT_LIMITS,
  ExecutionLimitError,
  ProgramError,
  executeProgram,
  validateProgram,
} from "./interpreter";
import type { ExecStep, ExecutionLimits } from "./interpreter";
import type { FunctionDef, Program } from "./program";
import type { ActionResult, BlockReason, LevelDef, RobotAction } from "./types";
import { WorldState } from "./world";

export type PortOutcome =
  | { ok: true; result: ActionResult | null }
  | { ok: false; error: string };

/** Jembatan ke dunia permainan. gameController memenuhi antarmuka ini. */
export interface ActionPort {
  perform(action: RobotAction): Promise<PortOutcome>;
  reset(): Promise<PortOutcome>;
}

export interface RunOptions {
  maxInstructions?: number;
  functions?: readonly FunctionDef[];
  /** Level, untuk membuat cermin dunia agar sensor bisa dibaca interpreter. */
  level?: LevelDef;
}

export type RunStatus =
  | "idle"
  | "running"
  | "paused"
  | "finished"
  | "failed"
  | "complete";

export interface RunState {
  status: RunStatus;
  /** Id instruksi yang sedang atau terakhir dieksekusi. */
  activeId: number | null;
  message: string;
  stepsExecuted: number;
}

const IDLE_STATE: RunState = {
  status: "idle",
  activeId: null,
  message: "Build your program, then press Execute.",
  stepsExecuted: 0,
};

export function describeBlock(reason: BlockReason | undefined): string {
  if (reason === "edge") return "The robot can't leave the island.";
  if (reason === "gate") return "The gate is closed. Find the switch.";
  return "Something is blocking the way.";
}

/**
 * Menjalankan program melalui interpreter: run, step, pause, resume, reset.
 * Murni TypeScript, tidak bergantung pada React atau Phaser.
 */
export class ProgramRunner {
  private state: RunState = { ...IDLE_STATE };
  private readonly listeners = new Set<() => void>();
  private readonly port: ActionPort;
  private readonly limits: ExecutionLimits;
  private token = 0;
  private iter: Generator<ExecStep, void, undefined> | null = null;
  private pauseRequested = false;
  private loopToken: number | null = null;
  private stepping = false;

  constructor(port: ActionPort, limits: Partial<ExecutionLimits> = {}) {
    this.port = port;
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getState = (): RunState => this.state;

  private set(patch: Partial<RunState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  /** Menjalankan dari awal, atau melanjutkan jika sedang dijeda. */
  async run(program: Program, options: RunOptions = {}): Promise<void> {
    const status = this.state.status;
    if (status === "running") return;
    if (status === "paused" && this.iter) {
      this.resume();
      return;
    }
    const token = await this.begin(program, options);
    if (token === null) return;
    await this.loop(token);
  }

  /** Menjalankan tepat satu langkah, lalu menjeda. */
  async step(program: Program, options: RunOptions = {}): Promise<void> {
    if (this.state.status === "running" || this.stepping) return;
    this.stepping = true;
    try {
      let token = this.token;
      if (!(this.state.status === "paused" && this.iter)) {
        const started = await this.begin(program, options);
        if (started === null) return;
        token = started;
      }
      const outcome = await this.advance(token);
      if (outcome === "continue" && token === this.token) {
        this.set({
          status: "paused",
          message: `Step ${this.state.stepsExecuted} done.`,
        });
      }
    } finally {
      this.stepping = false;
    }
  }

  pause(): void {
    if (this.state.status !== "running") return;
    this.pauseRequested = true;
    this.set({ status: "paused", message: "Paused." });
  }

  resume(): void {
    if (this.state.status !== "paused" || !this.iter) return;
    this.pauseRequested = false;
    this.set({ status: "running", message: "Running..." });
    void this.loop(this.token);
  }

  /** Menghentikan eksekusi dan mengembalikan board ke awal. Program tetap tersimpan. */
  async reset(): Promise<void> {
    this.token += 1;
    this.iter = null;
    this.pauseRequested = false;
    this.set({ ...IDLE_STATE, message: "Board reset. Your program is kept." });
    await this.port.reset();
  }

  private async begin(
    program: Program,
    options: RunOptions,
  ): Promise<number | null> {
    const functions = options.functions ?? [];
    const issues = validateProgram(
      program,
      options.maxInstructions ?? this.limits.maxInstructions,
      functions,
    );
    if (issues.length > 0) {
      this.set({
        status: "failed",
        activeId: null,
        message: issues[0] ?? "Invalid program.",
        stepsExecuted: 0,
      });
      return null;
    }

    this.token += 1;
    const token = this.token;
    this.pauseRequested = false;
    this.iter = null;
    this.set({
      status: "running",
      activeId: null,
      message: "Running...",
      stepsExecuted: 0,
    });

    await this.port.reset();
    if (token !== this.token) return null;

    const world = options.level ? new WorldState(options.level) : undefined;
    this.iter = executeProgram(program, this.limits, { world, functions });
    return token;
  }

  private async loop(token: number): Promise<void> {
    if (this.loopToken === token) return;
    this.loopToken = token;
    try {
      while (token === this.token && this.iter) {
        if (this.pauseRequested) {
          this.set({ status: "paused", message: "Paused." });
          return;
        }
        const outcome = await this.advance(token);
        if (outcome === "ended") return;
      }
    } finally {
      if (this.loopToken === token) this.loopToken = null;
    }
  }

  private fail(token: number, message: string): void {
    if (token !== this.token) return;
    this.iter = null;
    this.set({ status: "failed", activeId: null, message });
  }

  private async advance(token: number): Promise<"continue" | "ended"> {
    const iter = this.iter;
    if (!iter || token !== this.token) return "ended";

    let next: IteratorResult<ExecStep, void>;
    try {
      next = iter.next();
    } catch (error) {
      this.fail(
        token,
        error instanceof ExecutionLimitError || error instanceof ProgramError
          ? error.message
          : "Unexpected interpreter error.",
      );
      return "ended";
    }

    if (next.done) {
      this.iter = null;
      this.set({
        status: "finished",
        activeId: null,
        message: "Program finished, but the goal was not reached. Try again.",
      });
      return "ended";
    }

    const step = next.value;
    this.set({ activeId: step.instructionId });

    let outcome: PortOutcome;
    try {
      outcome = await this.port.perform(step.action);
    } catch {
      this.fail(token, "The game engine stopped responding.");
      return "ended";
    }
    if (token !== this.token) return "ended";

    if (!outcome.ok) {
      this.fail(token, `Engine error: ${outcome.error}.`);
      return "ended";
    }

    const stepsExecuted = this.state.stepsExecuted + 1;
    const result = outcome.result;

    if (result && !result.ok) {
      this.iter = null;
      this.set({
        status: "failed",
        message: describeBlock(result.reason),
        stepsExecuted,
      });
      return "ended";
    }
    if (result?.complete) {
      this.iter = null;
      this.set({
        status: "complete",
        activeId: null,
        message: "Goal reached!",
        stepsExecuted,
      });
      return "ended";
    }

    this.set({ stepsExecuted });
    return "continue";
  }
}