import { describe, expect, test } from "bun:test";
import { num } from "./builders";
import { countAll, createEditorState, editorReducer } from "./editor";
import type { EditorState } from "./editor";
import type { Slot } from "./program";
import type { RobotAction } from "./types";

function addAll(state: EditorState, actions: RobotAction[]): EditorState {
  return actions.reduce(
    (s, action) => editorReducer(s, { type: "add", action }),
    state,
  );
}

const actionsOf = (s: EditorState) =>
  s.program.map((i) => (i.kind === "action" ? i.action : i.kind));

describe("editorReducer (flat program)", () => {
  test("adds instructions with unique ids", () => {
    const s = addAll(createEditorState(), ["forward", "left", "forward"]);
    expect(actionsOf(s)).toEqual(["forward", "left", "forward"]);
    expect(new Set(s.program.map((i) => i.id)).size).toBe(3);
  });

  test("inserts at a given index", () => {
    const s = addAll(createEditorState(), ["forward", "forward"]);
    const next = editorReducer(s, { type: "add", action: "left", index: 1 });
    expect(actionsOf(next)).toEqual(["forward", "left", "forward"]);
  });

  test("respects the instruction limit", () => {
    let s = createEditorState();
    s = editorReducer(s, { type: "add", action: "forward", limit: 1 });
    s = editorReducer(s, { type: "add", action: "left", limit: 1 });
    expect(s.program.length).toBe(1);
  });

  test("removes by id", () => {
    const s = addAll(createEditorState(), ["forward", "left"]);
    const first = s.program[0];
    const next = editorReducer(s, { type: "remove", id: first?.id ?? -1 });
    expect(actionsOf(next)).toEqual(["left"]);
  });

  test("moves an instruction", () => {
    const s = addAll(createEditorState(), ["forward", "left", "right"]);
    const next = editorReducer(s, { type: "move", from: 0, to: 2 });
    expect(actionsOf(next)).toEqual(["left", "right", "forward"]);
  });

  test("undo and redo restore earlier states", () => {
    const s = addAll(createEditorState(), ["forward", "left"]);
    const undone = editorReducer(s, { type: "undo" });
    expect(actionsOf(undone)).toEqual(["forward"]);
    const redone = editorReducer(undone, { type: "redo" });
    expect(actionsOf(redone)).toEqual(["forward", "left"]);
  });

  test("a new edit clears the redo history", () => {
    const s = addAll(createEditorState(), ["forward", "left"]);
    const undone = editorReducer(s, { type: "undo" });
    const edited = editorReducer(undone, { type: "add", action: "right" });
    expect(edited.future.length).toBe(0);
  });

  test("clearing an empty program does not create history", () => {
    const s = editorReducer(createEditorState(), { type: "clear" });
    expect(s.past.length).toBe(0);
  });
});

describe("editorReducer (blocks)", () => {
  test("adds instructions inside a nested slot", () => {
    let s = editorReducer(createEditorState(), { type: "addBlock", block: "repeat" });
    const block = s.program[0];
    const slot: Slot = { owner: "block", id: block?.id ?? -1, slot: "body" };
    s = editorReducer(s, { type: "add", action: "forward", slot });
    const outer = s.program[0];
    expect(outer?.kind).toBe("repeat");
    expect(outer && outer.kind === "repeat" ? outer.body.length : -1).toBe(1);
    expect(countAll(s)).toBe(2);
  });

  test("relocates an instruction into a function body", () => {
    let s = createEditorState([], ["f1"]);
    s = editorReducer(s, { type: "add", action: "forward" });
    const id = s.program[0]?.id ?? -1;
    s = editorReducer(s, {
      type: "relocate",
      id,
      slot: { owner: "fn", fn: "f1" },
      index: 0,
    });
    expect(s.program.length).toBe(0);
    expect(s.functions[0]?.body.length).toBe(1);
  });

  test("refuses to drop a block into itself or its descendants", () => {
    let s = editorReducer(createEditorState(), { type: "addBlock", block: "repeat" });
    const outerId = s.program[0]?.id ?? -1;
    s = editorReducer(s, {
      type: "addBlock",
      block: "repeat",
      slot: { owner: "block", id: outerId, slot: "body" },
    });
    const outer = s.program[0];
    const inner = outer && outer.kind === "repeat" ? outer.body[0] : undefined;
    const result = editorReducer(s, {
      type: "relocate",
      id: outerId,
      slot: { owner: "block", id: inner?.id ?? -1, slot: "body" },
      index: 0,
    });
    expect(result).toBe(s);
  });

  test("edits a block's properties", () => {
    let s = editorReducer(createEditorState(), { type: "addBlock", block: "repeat" });
    const id = s.program[0]?.id ?? -1;
    s = editorReducer(s, { type: "edit", id, edit: { kind: "repeat", count: num(5) } });
    const block = s.program[0];
    expect(
      block && block.kind === "repeat" && block.count.kind === "number"
        ? block.count.value
        : -1,
    ).toBe(5);
  });

  test("changing parameters resizes the arguments of existing calls", () => {
    let s = createEditorState([], ["f1"]);
    s = editorReducer(s, { type: "addBlock", block: "call" });
    const argCount = () => {
      const c = s.program[0];
      return c && c.kind === "call" ? c.args.length : -1;
    };
    expect(argCount()).toBe(0);
    s = editorReducer(s, { type: "setParams", fn: "f1", params: ["n"] });
    expect(argCount()).toBe(1);
    s = editorReducer(s, { type: "setParams", fn: "f1", params: [] });
    expect(argCount()).toBe(0);
  });

  test("removes a nested instruction by id", () => {
    let s = editorReducer(createEditorState(), { type: "addBlock", block: "repeat" });
    const outerId = s.program[0]?.id ?? -1;
    s = editorReducer(s, {
      type: "add",
      action: "forward",
      slot: { owner: "block", id: outerId, slot: "body" },
    });
    const outer = s.program[0];
    const childId = outer && outer.kind === "repeat" ? (outer.body[0]?.id ?? -1) : -1;
    s = editorReducer(s, { type: "remove", id: childId });
    expect(countAll(s)).toBe(1);
  });

  test("clear also empties function bodies", () => {
    let s = createEditorState([], ["f1"]);
    s = editorReducer(s, {
      type: "add",
      action: "forward",
      slot: { owner: "fn", fn: "f1" },
    });
    s = editorReducer(s, { type: "clear" });
    expect(s.functions[0]?.body.length).toBe(0);
  });
});