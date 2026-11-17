import { countInstructions, functionLabel } from "./program";
import type {
  Clause,
  Condition,
  FunctionDef,
  Program,
  Value,
} from "./program";
import { readSensor } from "./sensors";
import type { RobotAction } from "./types";
import type { WorldState } from "./world";

export interface ExecutionLimits {
  /** Batas aksi robot yang dieksekusi. */
  maxSteps: number;
  /** Batas jumlah instruksi dalam program. */
  maxInstructions: number;
  /** Batas semua instruksi yang dievaluasi (menangkap loop tanpa aksi). */
  maxTicks: number;
  /** Batas kedalaman pemanggilan fungsi. */
  maxDepth: number;
  /** Batas jumlah ulangan satu blok Repeat. */
  maxRepeat: number;
}

export const DEFAULT_LIMITS: ExecutionLimits = {
  maxSteps: 500,
  maxInstructions: 40,
  maxTicks: 5000,
  maxDepth: 24,
  maxRepeat: 99,
};

export interface ExecStep {
  instructionId: number;
  action: RobotAction;
}

export interface ExecEnv {
  /** Cermin dunia untuk membaca sensor. Tanpa ini, sensor tidak tersedia. */
  world?: WorldState;
  functions?: readonly FunctionDef[];
}

export class ExecutionLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionLimitError";
  }
}

export class ProgramError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProgramError";
  }
}

const KNOWN_ACTIONS: ReadonlySet<string> = new Set([
  "forward",
  "left",
  "right",
  "wait",
  "collect",
  "interact",
]);

/** Memeriksa program sebelum dijalankan. Mengembalikan daftar masalah (kosong = valid). */
export function validateProgram(
  program: Program,
  maxInstructions: number,
  functions: readonly FunctionDef[] = [],
): string[] {
  const errors: string[] = [];
  const add = (message: string): void => {
    if (!errors.includes(message)) errors.push(message);
  };

  const total =
    countInstructions(program) +
    functions.reduce((sum, f) => sum + countInstructions(f.body), 0);

  if (program.length === 0) add("Add at least one command first.");
  if (total > maxInstructions) add(`Too many commands (max ${maxInstructions}).`);

  const byId = new Map(functions.map((f) => [f.id, f] as const));
  const visited = new Set<string>();

  const visit = (list: Program): void => {
    for (const ins of list) {
      switch (ins.kind) {
        case "action":
          if (!KNOWN_ACTIONS.has(ins.action)) {
            add(`Unknown command: ${String(ins.action)}.`);
          }
          break;
        case "repeat":
          if (ins.body.length === 0) add("Repeat needs at least one command inside.");
          visit(ins.body);
          break;
        case "while":
          if (ins.body.length === 0) add("While needs at least one command inside.");
          if (ins.condition.clauses.length === 0) add("While needs a condition.");
          visit(ins.body);
          break;
        case "if":
          if (ins.then.length === 0) add("If needs at least one command inside.");
          if (ins.condition.clauses.length === 0) add("If needs a condition.");
          visit(ins.then);
          visit(ins.else);
          break;
        case "set":
          break;
        case "call": {
          const fn = byId.get(ins.fn);
          if (!fn) {
            add(`Unknown function: ${ins.fn}.`);
            break;
          }
          if (ins.args.length !== fn.params.length) {
            add(`${functionLabel(fn.id)} needs ${fn.params.length} value(s).`);
          }
          if (fn.body.length === 0) add(`${functionLabel(fn.id)} is empty.`);
          if (!visited.has(fn.id)) {
            visited.add(fn.id);
            visit(fn.body);
          }
          break;
        }
        default:
          add("Unknown command.");
      }
    }
  };

  visit(program);
  return errors;
}

type Locals = ReadonlyMap<string, number>;

class Machine {
  private ticks = 0;
  private steps = 0;
  private depth = 0;
  private readonly globals = new Map<string, number>();
  private readonly limits: ExecutionLimits;
  private readonly world: WorldState | undefined;
  private readonly functions: ReadonlyMap<string, FunctionDef>;

  constructor(limits: ExecutionLimits, env: ExecEnv) {
    this.limits = limits;
    this.world = env.world;
    this.functions = new Map((env.functions ?? []).map((f) => [f.id, f] as const));
  }

  private tick(): void {
    this.ticks += 1;
    if (this.ticks > this.limits.maxTicks) {
      throw new ExecutionLimitError(
        "Execution stopped: the program ran too long. Check for a loop that never ends.",
      );
    }
  }

  private value(v: Value, locals: Locals): number {
    if (v.kind === "number") return v.value;
    const local = locals.get(v.name);
    if (local !== undefined) return local;
    return this.globals.get(v.name) ?? 0;
  }

  private clause(c: Clause, locals: Locals): boolean {
    if (c.kind === "sensor") {
      if (!this.world) throw new ProgramError("Sensors are not available here.");
      const result = readSensor(this.world, c.sensor);
      return c.not ? !result : result;
    }
    const left = this.value(c.left, locals);
    const right = this.value(c.right, locals);
    switch (c.op) {
      case "<":
        return left < right;
      case "<=":
        return left <= right;
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case ">=":
        return left >= right;
      case ">":
        return left > right;
    }
  }

  private condition(cond: Condition, locals: Locals): boolean {
    if (cond.clauses.length === 0) throw new ProgramError("A condition is empty.");
    return cond.join === "and"
      ? cond.clauses.every((c) => this.clause(c, locals))
      : cond.clauses.some((c) => this.clause(c, locals));
  }

  *run(program: Program, locals: Locals): Generator<ExecStep, void, undefined> {
    for (const ins of program) {
      this.tick();
      switch (ins.kind) {
        case "action": {
          this.steps += 1;
          if (this.steps > this.limits.maxSteps) {
            throw new ExecutionLimitError("Execution stopped: step limit reached.");
          }
          this.world?.apply(ins.action);
          yield { instructionId: ins.id, action: ins.action };
          break;
        }
        case "repeat": {
          const count = this.value(ins.count, locals);
          if (!Number.isInteger(count) || count < 0 || count > this.limits.maxRepeat) {
            throw new ProgramError(
              `Repeat count must be a whole number from 0 to ${this.limits.maxRepeat}.`,
            );
          }
          for (let i = 0; i < count; i++) {
            this.tick();
            yield* this.run(ins.body, locals);
          }
          break;
        }
        case "while": {
          while (this.condition(ins.condition, locals)) {
            this.tick();
            yield* this.run(ins.body, locals);
          }
          break;
        }
        case "if": {
          const branch = this.condition(ins.condition, locals) ? ins.then : ins.else;
          yield* this.run(branch, locals);
          break;
        }
        case "set": {
          const amount = this.value(ins.value, locals);
          const current = this.globals.get(ins.variable) ?? 0;
          const next =
            ins.op === "set" ? amount : ins.op === "add" ? current + amount : current - amount;
          this.globals.set(ins.variable, next);
          break;
        }
        case "call": {
          const fn = this.functions.get(ins.fn);
          if (!fn) throw new ProgramError(`Unknown function: ${ins.fn}.`);
          if (ins.args.length !== fn.params.length) {
            throw new ProgramError(
              `${functionLabel(fn.id)} needs ${fn.params.length} value(s).`,
            );
          }
          if (this.depth >= this.limits.maxDepth) {
            throw new ExecutionLimitError(
              "Execution stopped: functions call each other too deeply.",
            );
          }
          const frame = new Map<string, number>();
          fn.params.forEach((name, i) => {
            const arg = ins.args[i];
            frame.set(name, arg ? this.value(arg, locals) : 0);
          });
          this.depth += 1;
          try {
            yield* this.run(fn.body, frame);
          } finally {
            this.depth -= 1;
          }
          break;
        }
      }
    }
  }
}

/**
 * Interpreter terkontrol: menghasilkan langkah (aksi robot) satu per satu.
 * Mendukung loop, kondisi, fungsi, parameter, dan variabel.
 * Tidak memakai eval atau kode dinamis dari input pemain.
 */
export function* executeProgram(
  program: Program,
  limits: Partial<ExecutionLimits> = {},
  env: ExecEnv = {},
): Generator<ExecStep, void, undefined> {
  const machine = new Machine({ ...DEFAULT_LIMITS, ...limits }, env);
  yield* machine.run(program, new Map());
}