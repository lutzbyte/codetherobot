import type { LevelDef } from "@/engine/types";
import { DEMO_LEVEL } from "./demoLevel";
import { getLevelEntry } from "./levels/catalog";

/** Level untuk id route "dunia-nomor" (1-1 sampai 5-15). Id lain memakai level demo. */
export function getLevelDef(levelId: string): LevelDef {
  const entry = getLevelEntry(levelId);
  return entry ? entry.level : { ...DEMO_LEVEL, id: levelId };
}