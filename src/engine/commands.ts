import type { BlockKind } from "./program";
import type { RobotAction } from "./types";

export type CommandCategory =
  | "move"
  | "turn"
  | "loop"
  | "logic"
  | "action"
  | "data"
  | "function";

export interface CommandDef {
  id: string;
  label: string;
  category: CommandCategory;
  /** Aksi robot (command dasar). */
  action?: RobotAction;
  /** Jenis blok (loop, kondisi, variabel, fungsi). */
  block?: BlockKind;
}

export const COMMANDS: readonly CommandDef[] = [
  { id: "move", label: "Move Forward", category: "move", action: "forward" },
  { id: "left", label: "Turn Left", category: "turn", action: "left" },
  { id: "right", label: "Turn Right", category: "turn", action: "right" },
  { id: "collect", label: "Collect", category: "action", action: "collect" },
  { id: "interact", label: "Interact", category: "action", action: "interact" },
  { id: "wait", label: "Wait", category: "action", action: "wait" },
  { id: "repeat", label: "Repeat", category: "loop", block: "repeat" },
  { id: "while", label: "While", category: "loop", block: "while" },
  { id: "if", label: "If / Else", category: "logic", block: "if" },
  { id: "set", label: "Variable", category: "data", block: "set" },
  { id: "call", label: "Function", category: "function", block: "call" },
];

/** Command yang tersedia jika level tidak menentukan allowedCommands. */
export const DEFAULT_COMMAND_IDS: readonly string[] = [
  "move",
  "left",
  "right",
  "collect",
  "interact",
  "wait",
];

export function commandForAction(action: RobotAction): CommandDef | undefined {
  return COMMANDS.find((c) => c.action === action);
}

export function commandForBlock(kind: BlockKind): CommandDef | undefined {
  return COMMANDS.find((c) => c.block === kind);
}