import type {
  ActionInstruction,
  CallInstruction,
  Clause,
  CompareOp,
  Condition,
  IfInstruction,
  Program,
  RepeatInstruction,
  SensorName,
  SetInstruction,
  SetOp,
  Value,
  WhileInstruction,
} from "./program";
import type { RobotAction } from "./types";

export const num = (value: number): Value => ({ kind: "number", value });
export const vr = (name: string): Value => ({ kind: "var", name });

const toValue = (v: Value | number): Value => (typeof v === "number" ? num(v) : v);

export const act = (id: number, action: RobotAction): ActionInstruction => ({
  kind: "action",
  id,
  action,
});

export const rep = (
  id: number,
  count: Value | number,
  body: Program,
): RepeatInstruction => ({ kind: "repeat", id, count: toValue(count), body });

export const whileDo = (
  id: number,
  condition: Condition,
  body: Program,
): WhileInstruction => ({ kind: "while", id, condition, body });

export const ifElse = (
  id: number,
  condition: Condition,
  then: Program,
  otherwise: Program = [],
): IfInstruction => ({ kind: "if", id, condition, then, else: otherwise });

export const setVar = (
  id: number,
  variable: string,
  op: SetOp,
  value: Value | number,
): SetInstruction => ({ kind: "set", id, variable, op, value: toValue(value) });

export const call = (
  id: number,
  fn: string,
  args: ReadonlyArray<Value | number> = [],
): CallInstruction => ({ kind: "call", id, fn, args: args.map(toValue) });

export const sensor = (name: SensorName, not = false): Clause => ({
  kind: "sensor",
  sensor: name,
  not,
});

export const compare = (
  left: Value | number,
  op: CompareOp,
  right: Value | number,
): Clause => ({ kind: "compare", left: toValue(left), op, right: toValue(right) });

export const cond = (join: "and" | "or", ...clauses: Clause[]): Condition => ({
  join,
  clauses,
});

export const when = (...clauses: Clause[]): Condition => cond("and", ...clauses);

export function defaultArgs(length: number): Value[] {
  return Array.from({ length }, () => num(1));
}

export function resizeArgs(args: readonly Value[], length: number): Value[] {
  return Array.from({ length }, (_, i) => args[i] ?? num(1));
}