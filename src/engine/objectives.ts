import type { LevelDef } from "./types";

export type ObjectiveId = "goal" | "blocks" | "bonus";

export interface Objective {
  id: ObjectiveId;
  label: string;
  done: boolean;
}

export interface RunStats {
  /** Jumlah blok program (termasuk isi fungsi) saat level selesai. */
  blocks: number;
  /** Jumlah aksi robot yang dieksekusi. */
  steps: number;
  starsCollected: number;
}

export function countStars(level: LevelDef): number {
  return level.objects.filter((o) => o.kind === "star").length;
}

/** Tiga objective per level. Bintang = jumlah objective yang tercapai. */
export function evaluateObjectives(level: LevelDef, stats: RunStats): Objective[] {
  const starsTotal = countStars(level);

  const goal: Objective = { id: "goal", label: "Reach the goal", done: true };

  const blocks: Objective = {
    id: "blocks",
    label: `Use ${level.parCommands} blocks or fewer`,
    done: stats.blocks <= level.parCommands,
  };

  const parSteps = level.parSteps ?? stats.steps;
  const bonus: Objective =
    starsTotal > 0
      ? {
          id: "bonus",
          label: "Collect every star",
          done: stats.starsCollected >= starsTotal,
        }
      : {
          id: "bonus",
          label: `Finish in ${parSteps} moves or fewer`,
          done: stats.steps <= parSteps,
        };

  return [goal, blocks, bonus];
}

export function starsFromObjectives(objectives: readonly Objective[]): number {
  return objectives.filter((o) => o.done).length;
}