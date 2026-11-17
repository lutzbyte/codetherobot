import {
  BLOCKING_KINDS,
  isFloor,
  sameVec,
  step,
  turnLeft,
  turnRight,
} from "./level";
import type {
  ActionResult,
  BlockReason,
  Direction,
  LevelDef,
  LevelObject,
  ObjectKind,
  RobotAction,
  Vec,
  WorldSnapshot,
} from "./types";

/** State dunia permainan. Murni: tidak bergantung pada Phaser atau React. */
export class WorldState {
  private readonly level: LevelDef;
  private pos: Vec;
  private dir: Direction;
  private readonly collected = new Set<string>();
  private readonly openGates = new Set<string>();

  constructor(level: LevelDef) {
    this.level = level;
    this.pos = { ...level.start };
    this.dir = level.startDir;
  }

  getLevel(): LevelDef {
    return this.level;
  }

  reset(): void {
    this.pos = { ...this.level.start };
    this.dir = this.level.startDir;
    this.collected.clear();
    this.openGates.clear();
  }

  isGateOpen(id: string): boolean {
    return this.openGates.has(id);
  }

  starsTotal(): number {
    return this.level.objects.filter((o) => o.kind === "star").length;
  }

  starsCollected(): number {
    return this.level.objects.filter(
      (o) => o.kind === "star" && this.collected.has(o.id),
    ).length;
  }

  isComplete(): boolean {
    if (!sameVec(this.pos, this.level.goal)) return false;
    if (this.level.requireAllStars) {
      return this.starsCollected() === this.starsTotal();
    }
    return true;
  }

  atGoal(): boolean {
    return sameVec(this.pos, this.level.goal);
  }

  /** Apa yang menghalangi di sisi tertentu robot, atau null jika bebas. */
  blockReasonToward(side: "ahead" | "left" | "right"): BlockReason | null {
    const dir =
      side === "ahead"
        ? this.dir
        : side === "left"
          ? turnLeft(this.dir)
          : turnRight(this.dir);
    return this.blockReason(step(this.pos, dir));
  }

  /** Apakah ada objek jenis tertentu di tile robot saat ini. */
  hasHere(kind: ObjectKind): boolean {
    return this.objectsAt(this.pos).some((o) => o.kind === kind);
  }

  snapshot(): WorldSnapshot {
    return {
      pos: { ...this.pos },
      dir: this.dir,
      collected: [...this.collected],
      openGates: [...this.openGates],
    };
  }

  apply(action: RobotAction): ActionResult {
    let ok = true;
    let reason: BlockReason | undefined;
    let collectedId: string | undefined;
    let toggledGateIds: string[] | undefined;

    switch (action) {
      case "forward": {
        const next = step(this.pos, this.dir);
        const blocked = this.blockReason(next);
        if (blocked) {
          ok = false;
          reason = blocked;
        } else {
          this.pos = next;
        }
        break;
      }
      case "left":
        this.dir = turnLeft(this.dir);
        break;
      case "right":
        this.dir = turnRight(this.dir);
        break;
      case "wait":
        break;
      case "collect": {
        const star = this.objectsAt(this.pos).find((o) => o.kind === "star");
        if (star) {
          this.collected.add(star.id);
          collectedId = star.id;
        }
        break;
      }
      case "interact": {
        const sw = this.objectsAt(this.pos).find(
          (o) => o.kind === "switch" && o.linkedTo !== undefined,
        );
        const gateId = sw?.linkedTo;
        if (gateId !== undefined) {
          if (this.openGates.has(gateId)) this.openGates.delete(gateId);
          else this.openGates.add(gateId);
          toggledGateIds = [gateId];
        }
        break;
      }
    }

    return {
      action,
      ok,
      reason,
      collectedId,
      toggledGateIds,
      complete: this.isComplete(),
      snapshot: this.snapshot(),
    };
  }

  private objectsAt(v: Vec): LevelObject[] {
    return this.level.objects.filter(
      (o) => !this.collected.has(o.id) && sameVec(o.at, v),
    );
  }

  private blockReason(v: Vec): BlockReason | null {
    if (!isFloor(this.level, v)) return "edge";
    for (const obj of this.objectsAt(v)) {
      if (BLOCKING_KINDS.has(obj.kind)) return "obstacle";
      if (obj.kind === "gate" && !this.openGates.has(obj.id)) return "gate";
    }
    return null;
  }
}