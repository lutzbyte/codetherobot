import type { LevelDef } from "@/engine/types";

/**
 * Level demo untuk Fase 3. Data level sungguhan (75 level) dibuat di Fase 6.
 * Solusi: forward x3, right, forward, collect, forward, left, forward x2.
 */
export const DEMO_LEVEL: LevelDef = {
  id: "demo",
  name: "First Steps",
  rows: [
    ".ggpg.",
    "gggpgg",
    "gppppg",
    "gpgggg",
    "gpgggg",
    ".pggg.",
  ],
  start: { r: 5, c: 1 },
  startDir: 0,
  goal: { r: 0, c: 3 },
  objects: [
    { id: "star-1", kind: "star", at: { r: 2, c: 2 } },
    { id: "stone-1", kind: "stone", at: { r: 1, c: 2 } },
    { id: "crate-1", kind: "crate", at: { r: 3, c: 2 } },
    { id: "tree-1", kind: "tree", at: { r: 3, c: 3 } },
    { id: "tree-2", kind: "tree", at: { r: 1, c: 4 } },
  ],
  parCommands: 10,
};