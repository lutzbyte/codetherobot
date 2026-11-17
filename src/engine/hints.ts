import { commandForAction, commandForBlock } from "./commands";
import { countAll } from "./editor";
import type { Roots } from "./editor";
import { childLists, functionLabel } from "./program";
import type { Clause, Condition, Instruction, Program, Value } from "./program";
import { SENSORS } from "./sensors";

export const MAX_HINT_LEVEL = 3;
const INDENT = "  ";

function valueText(value: Value): string {
  return value.kind === "number" ? String(value.value) : value.name;
}

function clauseText(clause: Clause): string {
  if (clause.kind === "sensor") {
    const label = SENSORS.find((s) => s.id === clause.sensor)?.label ?? clause.sensor;
    return clause.not ? `not ${label}` : label;
  }
  return `${valueText(clause.left)} ${clause.op} ${valueText(clause.right)}`;
}

function conditionText(condition: Condition): string {
  return condition.clauses
    .map(clauseText)
    .join(condition.join === "and" ? " and " : " or ");
}

function labelOf(ins: Instruction): string {
  const def =
    ins.kind === "action" ? commandForAction(ins.action) : commandForBlock(ins.kind);
  return def?.label ?? ins.kind;
}

export function describeInstruction(ins: Instruction, depth = 0): string[] {
  const pad = INDENT.repeat(depth);
  switch (ins.kind) {
    case "action":
      return [`${pad}${labelOf(ins)}`];
    case "repeat":
      return [
        `${pad}Repeat ${valueText(ins.count)} times:`,
        ...describeProgram(ins.body, depth + 1),
      ];
    case "while":
      return [
        `${pad}While ${conditionText(ins.condition)}:`,
        ...describeProgram(ins.body, depth + 1),
      ];
    case "if": {
      const lines = [
        `${pad}If ${conditionText(ins.condition)}:`,
        ...describeProgram(ins.then, depth + 1),
      ];
      if (ins.else.length > 0) {
        lines.push(`${pad}Else:`, ...describeProgram(ins.else, depth + 1));
      }
      return lines;
    }
    case "set": {
      const op = ins.op === "set" ? "=" : ins.op === "add" ? "+=" : "-=";
      return [`${pad}Set ${ins.variable} ${op} ${valueText(ins.value)}`];
    }
    case "call":
      return [
        `${pad}Call ${functionLabel(ins.fn)}(${ins.args.map(valueText).join(", ")})`,
      ];
  }
}

export function describeProgram(program: Program, depth = 0): string[] {
  return program.flatMap((ins) => describeInstruction(ins, depth));
}

function collectLabels(program: Program, into: Set<string>): void {
  for (const ins of program) {
    into.add(labelOf(ins));
    for (const list of childLists(ins)) collectLabels(list, into);
  }
}

/**
 * Petunjuk bertingkat dari solusi referensi:
 * 1 = jumlah dan jenis blok, 2 = langkah pertama, 3 = seluruh solusi.
 */
export function buildHint(solution: Roots, level: number): string {
  const clamped = Math.min(MAX_HINT_LEVEL, Math.max(1, Math.floor(level)));

  if (clamped === 1) {
    const labels = new Set<string>();
    collectLabels(solution.program, labels);
    for (const fn of solution.functions) collectLabels(fn.body, labels);
    return `The best solution uses ${countAll(solution)} blocks: ${[...labels].join(", ")}.`;
  }

  if (clamped === 2) {
    const first = solution.program[0];
    const lines = first ? describeInstruction(first) : [];
    const more = solution.program.length > 1 ? ["..."] : [];
    return ["Start like this:", ...lines, ...more].join("\n");
  }

  const parts = ["Main program:", ...describeProgram(solution.program, 1)];
  for (const fn of solution.functions) {
    if (fn.body.length === 0) continue;
    const params = fn.params.length > 0 ? ` (${fn.params.join(", ")})` : "";
    parts.push("", `${functionLabel(fn.id)}${params}:`, ...describeProgram(fn.body, 1));
  }
  return parts.join("\n");
}