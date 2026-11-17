import type { SensorName } from "./program";
import type { WorldState } from "./world";

export const SENSORS: readonly { id: SensorName; label: string }[] = [
  { id: "pathAhead", label: "path ahead" },
  { id: "pathLeft", label: "path left" },
  { id: "pathRight", label: "path right" },
  { id: "blockedAhead", label: "blocked ahead" },
  { id: "gateAhead", label: "gate ahead" },
  { id: "starHere", label: "star here" },
  { id: "switchHere", label: "switch here" },
  { id: "atGoal", label: "at goal" },
];

export function readSensor(world: WorldState, sensor: SensorName): boolean {
  switch (sensor) {
    case "pathAhead":
      return world.blockReasonToward("ahead") === null;
    case "pathLeft":
      return world.blockReasonToward("left") === null;
    case "pathRight":
      return world.blockReasonToward("right") === null;
    case "blockedAhead":
      return world.blockReasonToward("ahead") !== null;
    case "gateAhead":
      return world.blockReasonToward("ahead") === "gate";
    case "starHere":
      return world.hasHere("star");
    case "switchHere":
      return world.hasHere("switch");
    case "atGoal":
      return world.atGoal();
  }
}