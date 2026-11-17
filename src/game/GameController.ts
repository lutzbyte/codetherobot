import { DEFAULT_LOOK } from "@/engine/look";
import type { RobotLook } from "@/engine/look";
import type { ActionResult, LevelDef, RobotAction } from "@/engine/types";
import { EventBus } from "./EventBus";
import type { CommandResultPayload } from "./EventBus";

export type ControllerError =
  | "not-ready"
  | "busy"
  | "no-level"
  | "closed"
  | "timeout";

export type ControllerResult =
  | { ok: true; result: ActionResult | null }
  | { ok: false; error: ControllerError };

/** Antarmuka React → Phaser. Interpreter hanya berbicara lewat ini. */
export interface GameController {
  load(level: LevelDef, look?: RobotLook): void;
  perform(action: RobotAction): Promise<ControllerResult>;
  reset(): Promise<ControllerResult>;
  isReady(): boolean;
}

const COMMAND_TIMEOUT_MS = 15000;

let nextId = 0;
let readyScenes = 0;
let currentLevel: LevelDef | null = null;
let currentLook: RobotLook = DEFAULT_LOOK;
const pending = new Map<number, (payload: CommandResultPayload) => void>();

EventBus.on("scene-ready", () => {
  readyScenes += 1;
});

EventBus.on("scene-closed", () => {
  readyScenes = Math.max(0, readyScenes - 1);
  if (readyScenes > 0) return;
  const handlers = [...pending.entries()];
  pending.clear();
  for (const [id, handler] of handlers) {
    handler({ id, result: null, error: "closed" });
  }
});

EventBus.on("command-result", (payload) => {
  const handler = pending.get(payload.id);
  if (!handler) return;
  pending.delete(payload.id);
  handler(payload);
});

function send(action: RobotAction | "reset"): Promise<ControllerResult> {
  if (readyScenes === 0) {
    return Promise.resolve({ ok: false, error: "not-ready" });
  }
  nextId += 1;
  const id = nextId;

  return new Promise<ControllerResult>((resolve) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      resolve({ ok: false, error: "timeout" });
    }, COMMAND_TIMEOUT_MS);

    pending.set(id, (payload) => {
      window.clearTimeout(timer);
      if (payload.error) resolve({ ok: false, error: payload.error });
      else resolve({ ok: true, result: payload.result });
    });

    EventBus.emit("robot-command", { id, action });
  });
}

/** Level terakhir yang dimuat. Scene membacanya saat dibuat. */
export function getCurrentLevel(): LevelDef | null {
  return currentLevel;
}

/** Tampilan robot (warna, aksesori, jejak) untuk level yang sedang dimuat. */
export function getCurrentLook(): RobotLook {
  return currentLook;
}

export const gameController: GameController = {
  load(level, look = DEFAULT_LOOK) {
    currentLevel = level;
    currentLook = look;
    EventBus.emit("level-load", level);
  },
  perform(action) {
    return send(action);
  },
  reset() {
    return send("reset");
  },
  isReady() {
    return readyScenes > 0;
  },
};