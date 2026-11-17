import Phaser from "phaser";
import type { ActionResult, LevelDef, RobotAction } from "@/engine/types";

export interface RobotCommand {
  id: number;
  action: RobotAction | "reset";
}

export interface CommandResultPayload {
  id: number;
  result: ActionResult | null;
  error?: "no-level" | "busy" | "closed";
}

export interface LevelCompletePayload {
  levelId: string;
  starsCollected: number;
  starsTotal: number;
}

/** Kontrak event React ⇄ Phaser. Tambah event baru di sini agar tetap bertipe. */
export interface GameEvents {
  "scene-ready": { sceneKey: string };
  "scene-closed": { sceneKey: string };
  "level-load": LevelDef;
  "robot-command": RobotCommand;
  "command-result": CommandResultPayload;
  "level-complete": LevelCompletePayload;
}

type EventName = keyof GameEvents;

const emitter = new Phaser.Events.EventEmitter();

export const EventBus = {
  emit<K extends EventName>(event: K, payload: GameEvents[K]): void {
    emitter.emit(event, payload);
  },
  on<K extends EventName>(
    event: K,
    handler: (payload: GameEvents[K]) => void,
  ): () => void {
    emitter.on(event, handler);
    return () => {
      emitter.off(event, handler);
    };
  },
};