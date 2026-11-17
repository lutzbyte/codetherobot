import { defaultArgs, num, resizeArgs } from "./builders";
import {
  MAIN_SLOT,
  PARAM_NAMES,
  containsId,
  countInstructions,
  findNode,
  maxId,
} from "./program";
import type {
  BlockKind,
  BlockSlotName,
  Condition,
  FunctionDef,
  Instruction,
  Program,
  SetOp,
  Slot,
  Value,
} from "./program";
import type { RobotAction } from "./types";

export const HISTORY_LIMIT = 100;

export interface Roots {
  program: Program;
  functions: readonly FunctionDef[];
}

export interface EditorState extends Roots {
  past: Roots[];
  future: Roots[];
  nextId: number;
}

export type InstructionEdit =
  | { kind: "repeat"; count: Value }
  | { kind: "condition"; condition: Condition }
  | { kind: "set"; variable: string; op: SetOp; value: Value }
  | { kind: "call"; fn: string; args: readonly Value[] };

export type EditorAction =
  | { type: "add"; action: RobotAction; index?: number; limit?: number; slot?: Slot }
  | {
      type: "addBlock";
      block: BlockKind;
      index?: number;
      limit?: number;
      slot?: Slot;
      variable?: string;
    }
  | { type: "relocate"; id: number; slot: Slot; index: number }
  | { type: "edit"; id: number; edit: InstructionEdit }
  | { type: "setParams"; fn: string; params: readonly string[] }
  | { type: "remove"; id: number }
  | { type: "move"; from: number; to: number }
  | { type: "clear" }
  | { type: "undo" }
  | { type: "redo" };

export function createEditorState(
  program: Program = [],
  functionIds: readonly string[] = [],
): EditorState {
  const functions = functionIds.map(
    (id): FunctionDef => ({ id, params: [], body: [] }),
  );
  return {
    program,
    functions,
    past: [],
    future: [],
    nextId: maxId(program) + 1,
  };
}

/** Jumlah semua instruksi: program utama dan isi semua fungsi. */
export function countAll(roots: Roots): number {
  return (
    countInstructions(roots.program) +
    roots.functions.reduce((sum, f) => sum + countInstructions(f.body), 0)
  );
}

/* ---------- Operasi pohon (immutable) ---------- */

function mapChildren(
  ins: Instruction,
  f: (list: Program) => Program | null,
): Instruction | null {
  switch (ins.kind) {
    case "repeat": {
      const body = f(ins.body);
      return body ? { ...ins, body } : null;
    }
    case "while": {
      const body = f(ins.body);
      return body ? { ...ins, body } : null;
    }
    case "if": {
      const then = f(ins.then);
      if (then) return { ...ins, then };
      const other = f(ins.else);
      return other ? { ...ins, else: other } : null;
    }
    case "action":
    case "set":
    case "call":
      return null;
  }
}

function replaceNode(
  program: Program,
  id: number,
  fn: (ins: Instruction) => Instruction,
): Program | null {
  for (let i = 0; i < program.length; i++) {
    const ins = program[i];
    if (!ins) continue;
    if (ins.id === id) {
      const next = [...program];
      next[i] = fn(ins);
      return next;
    }
    const inner = mapChildren(ins, (list) => replaceNode(list, id, fn));
    if (inner) {
      const next = [...program];
      next[i] = inner;
      return next;
    }
  }
  return null;
}

function removeNode(
  program: Program,
  id: number,
): { program: Program; node: Instruction } | null {
  const found: { node: Instruction | null } = { node: null };

  const walk = (list: Program): Program | null => {
    for (let i = 0; i < list.length; i++) {
      const ins = list[i];
      if (!ins) continue;
      if (ins.id === id) {
        found.node = ins;
        return list.filter((_, index) => index !== i);
      }
      const inner = mapChildren(ins, walk);
      if (inner) {
        const next = [...list];
        next[i] = inner;
        return next;
      }
    }
    return null;
  };

  const next = walk(program);
  return next && found.node ? { program: next, node: found.node } : null;
}

function mapAll(program: Program, f: (ins: Instruction) => Instruction): Program {
  return program.map((ins): Instruction => {
    const mapped = f(ins);
    switch (mapped.kind) {
      case "repeat":
        return { ...mapped, body: mapAll(mapped.body, f) };
      case "while":
        return { ...mapped, body: mapAll(mapped.body, f) };
      case "if":
        return {
          ...mapped,
          then: mapAll(mapped.then, f),
          else: mapAll(mapped.else, f),
        };
      default:
        return mapped;
    }
  });
}

function replaceInRoots(
  roots: Roots,
  id: number,
  fn: (ins: Instruction) => Instruction,
): Roots | null {
  const inMain = replaceNode(roots.program, id, fn);
  if (inMain) return { program: inMain, functions: roots.functions };
  for (const [index, f] of roots.functions.entries()) {
    const body = replaceNode(f.body, id, fn);
    if (body) {
      const functions = [...roots.functions];
      functions[index] = { ...f, body };
      return { program: roots.program, functions };
    }
  }
  return null;
}

function removeFromRoots(
  roots: Roots,
  id: number,
): { roots: Roots; node: Instruction } | null {
  const inMain = removeNode(roots.program, id);
  if (inMain) {
    return {
      roots: { program: inMain.program, functions: roots.functions },
      node: inMain.node,
    };
  }
  for (const [index, f] of roots.functions.entries()) {
    const result = removeNode(f.body, id);
    if (result) {
      const functions = [...roots.functions];
      functions[index] = { ...f, body: result.program };
      return { roots: { program: roots.program, functions }, node: result.node };
    }
  }
  return null;
}

function withChildList(
  ins: Instruction,
  name: BlockSlotName,
  update: (list: Program) => Program,
): Instruction {
  if ((ins.kind === "repeat" || ins.kind === "while") && name === "body") {
    return { ...ins, body: update(ins.body) };
  }
  if (ins.kind === "if" && name === "then") return { ...ins, then: update(ins.then) };
  if (ins.kind === "if" && name === "else") return { ...ins, else: update(ins.else) };
  return ins;
}

function updateSlot(
  roots: Roots,
  slot: Slot,
  update: (list: Program) => Program,
): Roots | null {
  if (slot.owner === "main") {
    return { program: update(roots.program), functions: roots.functions };
  }
  if (slot.owner === "fn") {
    const index = roots.functions.findIndex((f) => f.id === slot.fn);
    const fn = roots.functions[index];
    if (!fn) return null;
    const functions = [...roots.functions];
    functions[index] = { ...fn, body: update(fn.body) };
    return { program: roots.program, functions };
  }
  const name = slot.slot;
  return replaceInRoots(roots, slot.id, (ins) => withChildList(ins, name, update));
}

function insertInto(
  roots: Roots,
  slot: Slot,
  index: number | undefined,
  node: Instruction,
): Roots | null {
  return updateSlot(roots, slot, (list) => {
    const at = Math.min(Math.max(index ?? list.length, 0), list.length);
    const next = [...list];
    next.splice(at, 0, node);
    return next;
  });
}

function applyEdit(ins: Instruction, edit: InstructionEdit): Instruction {
  switch (edit.kind) {
    case "repeat":
      return ins.kind === "repeat" ? { ...ins, count: edit.count } : ins;
    case "condition":
      return ins.kind === "while" || ins.kind === "if"
        ? { ...ins, condition: edit.condition }
        : ins;
    case "set":
      return ins.kind === "set"
        ? { ...ins, variable: edit.variable, op: edit.op, value: edit.value }
        : ins;
    case "call":
      return ins.kind === "call" ? { ...ins, fn: edit.fn, args: edit.args } : ins;
  }
}

function makeBlock(
  kind: BlockKind,
  id: number,
  variable: string,
  fn: FunctionDef | undefined,
): Instruction | null {
  const condition: Condition = {
    join: "and",
    clauses: [{ kind: "sensor", sensor: "pathAhead", not: false }],
  };
  switch (kind) {
    case "repeat":
      return { kind: "repeat", id, count: num(2), body: [] };
    case "while":
      return { kind: "while", id, condition, body: [] };
    case "if":
      return { kind: "if", id, condition, then: [], else: [] };
    case "set":
      return { kind: "set", id, variable, op: "set", value: num(1) };
    case "call":
      return fn
        ? { kind: "call", id, fn: fn.id, args: defaultArgs(fn.params.length) }
        : null;
  }
}

function findAnywhere(roots: Roots, id: number): Instruction | null {
  const inMain = findNode(roots.program, id);
  if (inMain) return inMain;
  for (const f of roots.functions) {
    const found = findNode(f.body, id);
    if (found) return found;
  }
  return null;
}

/** False jika blok akan dijatuhkan ke dalam dirinya sendiri atau turunannya. */
export function isDropAllowed(roots: Roots, draggedId: number, slot: Slot): boolean {
  if (slot.owner !== "block") return true;
  if (slot.id === draggedId) return false;
  const node = findAnywhere(roots, draggedId);
  return !(node && containsId(node, slot.id));
}

/* ---------- Reducer ---------- */

function rootsOf(state: EditorState): Roots {
  return { program: state.program, functions: state.functions };
}

function commit(state: EditorState, next: Roots): EditorState {
  return {
    ...state,
    program: next.program,
    functions: next.functions,
    past: [...state.past, rootsOf(state)].slice(-HISTORY_LIMIT),
    future: [],
  };
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case "add": {
      if (action.limit !== undefined && countAll(state) >= action.limit) return state;
      const node: Instruction = {
        kind: "action",
        id: state.nextId,
        action: action.action,
      };
      const next = insertInto(rootsOf(state), action.slot ?? MAIN_SLOT, action.index, node);
      if (!next) return state;
      return { ...commit(state, next), nextId: state.nextId + 1 };
    }
    case "addBlock": {
      if (action.limit !== undefined && countAll(state) >= action.limit) return state;
      const node = makeBlock(
        action.block,
        state.nextId,
        action.variable ?? "count",
        state.functions[0],
      );
      if (!node) return state;
      const next = insertInto(rootsOf(state), action.slot ?? MAIN_SLOT, action.index, node);
      if (!next) return state;
      return { ...commit(state, next), nextId: state.nextId + 1 };
    }
    case "relocate": {
      const roots = rootsOf(state);
      if (!isDropAllowed(roots, action.id, action.slot)) return state;
      const removed = removeFromRoots(roots, action.id);
      if (!removed) return state;
      const next = insertInto(removed.roots, action.slot, action.index, removed.node);
      if (!next) return state;
      return commit(state, next);
    }
    case "edit": {
      const next = replaceInRoots(rootsOf(state), action.id, (ins) =>
        applyEdit(ins, action.edit),
      );
      if (!next) return state;
      return commit(state, next);
    }
    case "setParams": {
      const params = action.params;
      const valid =
        params.length <= PARAM_NAMES.length &&
        new Set(params).size === params.length &&
        params.every((p) => PARAM_NAMES.some((name) => name === p));
      const target = state.functions.find((f) => f.id === action.fn);
      if (!valid || !target) return state;

      const fix = (ins: Instruction): Instruction =>
        ins.kind === "call" && ins.fn === action.fn
          ? { ...ins, args: resizeArgs(ins.args, params.length) }
          : ins;

      return commit(state, {
        program: mapAll(state.program, fix),
        functions: state.functions.map(
          (f): FunctionDef => ({
            id: f.id,
            params: f.id === action.fn ? params : f.params,
            body: mapAll(f.body, fix),
          }),
        ),
      });
    }
    case "remove": {
      const removed = removeFromRoots(rootsOf(state), action.id);
      if (!removed) return state;
      return commit(state, removed.roots);
    }
    case "move": {
      const { from, to } = action;
      const max = state.program.length - 1;
      if (from === to || from < 0 || to < 0 || from > max || to > max) return state;
      const next = [...state.program];
      const [item] = next.splice(from, 1);
      if (!item) return state;
      next.splice(to, 0, item);
      return commit(state, { program: next, functions: state.functions });
    }
    case "clear": {
      const empty =
        state.program.length === 0 && state.functions.every((f) => f.body.length === 0);
      if (empty) return state;
      return commit(state, {
        program: [],
        functions: state.functions.map((f) => ({ ...f, body: [] })),
      });
    }
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        ...state,
        program: previous.program,
        functions: previous.functions,
        past: state.past.slice(0, -1),
        future: [rootsOf(state), ...state.future],
      };
    }
    case "redo": {
      const [upcoming, ...rest] = state.future;
      if (!upcoming) return state;
      return {
        ...state,
        program: upcoming.program,
        functions: upcoming.functions,
        past: [...state.past, rootsOf(state)],
        future: rest,
      };
    }
  }
}