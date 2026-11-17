import type { Roots } from "./editor";
import { executeProgram } from "./interpreter";
import type { ExecutionLimits } from "./interpreter";
import type { LevelDef } from "./types";
import { WorldState } from "./world";

export interface SimResult {
  complete: boolean;
  /** Jumlah aksi robot yang dieksekusi sampai selesai (atau berhenti). */
  steps: number;
  starsCollected: number;
  error?: string;
}

/**
 * Menjalankan solusi pada level tanpa Phaser. Dipakai untuk memvalidasi level,
 * menghitung par, dan menguji bahwa setiap level bisa diselesaikan.
 */
export function simulate(
  level: LevelDef,
  solution: Roots,
  limits: Partial<ExecutionLimits> = {},
): SimResult {
  const sensorWorld = new WorldState(level);
  const play = new WorldState(level);
  let steps = 0;

  try {
    const stream = executeProgram(solution.program, limits, {
      world: sensorWorld,
      functions: solution.functions,
    });
    for (const step of stream) {
      steps += 1;
      const result = play.apply(step.action);
      if (!result.ok) {
        return {
          complete: false,
          steps,
          starsCollected: play.starsCollected(),
          error: `blocked (${result.reason ?? "unknown"}) at step ${steps}`,
        };
      }
      if (result.complete) {
        return { complete: true, steps, starsCollected: play.starsCollected() };
      }
    }
  } catch (error) {
    return {
      complete: false,
      steps,
      starsCollected: play.starsCollected(),
      error: error instanceof Error ? error.message : "unknown error",
    };
  }

  return {
    complete: false,
    steps,
    starsCollected: play.starsCollected(),
    error: "program ended before the goal",
  };
}