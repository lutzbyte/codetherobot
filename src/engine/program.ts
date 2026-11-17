import type { RobotAction } from "./types";

export type SensorName =
  | "pathAhead"
  | "pathLeft"
  | "pathRight"
  | "blockedAhead"
  | "gateAhead"
  | "starHere"
  | "switchHere"
  | "atGoal";

export type Value =
  | { kind: "number"; value: number }
  | { kind: "var"; name: string };

export type CompareOp = "<" | "<=" | "==" | "!=" | ">=" | ">";
export const COMPARE_OPS: readonly CompareOp[] = ["<", "<=", "==", "!=", ">=", ">"];

export type SetOp = "set" | "add" | "sub";

export type Clause =
  | { kind: "sensor"; sensor: SensorName; not: boolean }
  | { kind: "compare"; left: Value; op: CompareOp; right: Value };

/** Kondisi kompleks: beberapa klausa digabung dengan and atau or. */
export interface Condition {
  join: "and" | "or";
  clauses: readonly Clause[];
}

export interface ActionInstruction {
  kind: "action";
  id: number;
  action: RobotAction;
}

export interface RepeatInstruction {
  kind: "repeat";
  id: number;
  count: Value;
  body: Program;
}

export interface WhileInstruction {
  kind: "while";
  id: number;
  condition: Condition;
  body: Program;
}

export interface IfInstruction {
  kind: "if";
  id: number;
  condition: Condition;
  then: Program;
  else: Program;
}

export interface SetInstruction {
  kind: "set";
  id: number;
  variable: string;
  op: SetOp;
  value: Value;
}

export interface CallInstruction {
  kind: "call";
  id: number;
  fn: string;
  args: readonly Value[];
}

export type Instruction =
  | ActionInstruction
  | RepeatInstruction
  | WhileInstruction
  | IfInstruction
  | SetInstruction
  | CallInstruction;

export type Program = readonly Instruction[];

export interface FunctionDef {
  id: string;
  params: readonly string[];
  body: Program;
}

export const PARAM_NAMES = ["n", "m"] as const;

export type BlockKind = "repeat" | "while" | "if" | "set" | "call";

/* ---------- Slot: lokasi daftar instruksi di editor ---------- */

export type BlockSlotName = "body" | "then" | "else";

export type Slot =
  | { owner: "main" }
  | { owner: "fn"; fn: string }
  | { owner: "block"; id: number; slot: BlockSlotName };

export const MAIN_SLOT: Slot = { owner: "main" };

export function slotKey(slot: Slot): string {
  if (slot.owner === "main") return "main";
  if (slot.owner === "fn") return `fn:${slot.fn}`;
  return `blk:${slot.id}:${slot.slot}`;
}

export function parseSlotKey(key: string): Slot | null {
  if (key === "main") return { owner: "main" };
  if (key.startsWith("fn:")) return { owner: "fn", fn: key.slice(3) };
  const match = /^blk:(\d+):(body|then|else)$/.exec(key);
  if (match) {
    const name = match[2];
    if (name === "body" || name === "then" || name === "else") {
      return { owner: "block", id: Number(match[1]), slot: name };
    }
  }
  return null;
}

/* ---------- Utilitas pohon ---------- */

export function childLists(ins: Instruction): Program[] {
  switch (ins.kind) {
    case "repeat":
      return [ins.body];
    case "while":
      return [ins.body];
    case "if":
      return [ins.then, ins.else];
    default:
      return [];
  }
}

export function countInstructions(program: Program): number {
  let total = 0;
  for (const ins of program) {
    total += 1;
    for (const list of childLists(ins)) total += countInstructions(list);
  }
  return total;
}

export function containsId(ins: Instruction, id: number): boolean {
  for (const list of childLists(ins)) {
    for (const child of list) {
      if (child.id === id || containsId(child, id)) return true;
    }
  }
  return false;
}

export function findNode(program: Program, id: number): Instruction | null {
  for (const ins of program) {
    if (ins.id === id) return ins;
    for (const list of childLists(ins)) {
      const found = findNode(list, id);
      if (found) return found;
    }
  }
  return null;
}

export function maxId(program: Program): number {
  let max = 0;
  for (const ins of program) {
    max = Math.max(max, ins.id);
    for (const list of childLists(ins)) max = Math.max(max, maxId(list));
  }
  return max;
}

/** "f1" → "Function A". */
export function functionLabel(id: string): string {
  const n = Number(id.replace(/^f/, ""));
  if (Number.isInteger(n) && n >= 1 && n <= 26) {
    return `Function ${String.fromCharCode(64 + n)}`;
  }
  return id;
}