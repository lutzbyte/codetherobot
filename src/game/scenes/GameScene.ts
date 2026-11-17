import Phaser from "phaser";
import { playSfx } from "@/audio";
import { tileKindAt } from "@/engine/level";
import type { ActionResult, LevelDef, RobotAction, Vec } from "@/engine/types";
import { WorldState } from "@/engine/world";
import { reducedMotion, tweenAsync } from "../anim";
import { GOAL, GRASS_A, GRASS_B, PATH, drawCube } from "../draw";
import { burst, pulse } from "../effects";
import { createGoalFlag, createObjectView, redrawGate } from "../entities/objects";
import type { ObjectView } from "../entities/objects";
import { RobotSprite, createRobotTextures } from "../entities/RobotSprite";
import { EventBus } from "../EventBus";
import type { RobotCommand } from "../EventBus";
import { getCurrentLevel, getCurrentLook } from "../GameController";
import { HALF_W, TILE_H, levelBounds, project } from "../iso";
import type { Bounds } from "../iso";

const CONFETTI = [0x3fb950, 0x2f6bdb, 0xf5882a, 0xffc21a];

export class GameScene extends Phaser.Scene {
  static readonly KEY = "GameScene";

  private world: WorldState | null = null;
  private bounds: Bounds | null = null;
  private tilesLayer: Phaser.GameObjects.Graphics | null = null;
  private flag: Phaser.GameObjects.Graphics | null = null;
  private robot: RobotSprite | null = null;
  private readonly objectViews = new Map<string, ObjectView>();
  private readonly unsubscribers: Array<() => void> = [];
  private busy = false;
  private cleaned = false;

  constructor() {
    super(GameScene.KEY);
  }

  private get alive(): boolean {
    return !this.cleaned;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x3d93d4);
    this.scale.on("resize", this.fitCamera, this);

    this.unsubscribers.push(
      EventBus.on("level-load", (level) => this.loadLevel(level, true)),
      EventBus.on("robot-command", (cmd) => {
        void this.handleCommand(cmd);
      }),
    );

    this.game.events.once("ctr-dispose", this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

    const initial = getCurrentLevel();
    if (initial) this.loadLevel(initial, true);

    EventBus.emit("scene-ready", { sceneKey: GameScene.KEY });
  }

  private cleanup(): void {
    if (this.cleaned) return;
    this.cleaned = true;
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers.length = 0;
    this.game.events.off("ctr-dispose", this.cleanup, this);
    this.scale.off("resize", this.fitCamera, this);
    EventBus.emit("scene-closed", { sceneKey: GameScene.KEY });
  }

  private clearLevel(): void {
    this.tilesLayer?.destroy();
    this.tilesLayer = null;
    this.flag?.destroy();
    this.flag = null;
    this.robot?.destroy();
    this.robot = null;
    for (const view of this.objectViews.values()) {
      this.tweens.killTweensOf(view.gfx);
      view.gfx.destroy();
    }
    this.objectViews.clear();
  }

  /** intro = true hanya saat level dimuat; reset di tengah permainan tidak memutar intro lagi. */
  private loadLevel(level: LevelDef, intro = false): void {
    if (!this.alive) return;
    this.clearLevel();

    this.world = new WorldState(level);
    this.bounds = levelBounds(level);
    this.drawTiles(level);
    this.flag = createGoalFlag(this, level.goal);
    for (const obj of level.objects) {
      this.objectViews.set(obj.id, createObjectView(this, obj, false));
    }

    const look = getCurrentLook();
    createRobotTextures(this, look);
    this.robot = new RobotSprite(this, level.start, level.startDir, look);
    this.fitCamera();
    if (intro) this.playIntro();
  }

  private playIntro(): void {
    if (reducedMotion()) return;
    const cam = this.cameras.main;
    const target = cam.zoom;
    cam.setZoom(target * 0.88);
    this.tweens.add({
      targets: cam,
      zoom: target,
      duration: 260,
      ease: "Cubic.easeOut",
    });
  }

  private drawTiles(level: LevelDef): void {
    const g = this.add.graphics();
    g.setDepth(-100000);

    const cells: Vec[] = [];
    level.rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (tileKindAt(level, { r, c }) !== "void") cells.push({ r, c });
      }
    });
    cells.sort((a, b) => a.r + a.c - (b.r + b.c) || a.r - b.r);

    for (const cell of cells) {
      const p = project(cell);
      const isGoal = cell.r === level.goal.r && cell.c === level.goal.c;
      const colors = isGoal
        ? GOAL
        : tileKindAt(level, cell) === "path"
          ? PATH
          : (cell.r + cell.c) % 2 === 0
            ? GRASS_A
            : GRASS_B;
      drawCube(g, p.x, p.y, HALF_W, TILE_H, colors);
    }
    this.tilesLayer = g;
  }

  /** Menyesuaikan zoom dan posisi kamera agar seluruh board terlihat. */
  private fitCamera(): void {
    if (!this.bounds || !this.alive) return;
    const { width, height } = this.scale;
    const margin = 24;
    const zoom = Phaser.Math.Clamp(
      Math.min(
        (width - margin * 2) / this.bounds.w,
        (height - margin * 2) / this.bounds.h,
      ),
      0.25,
      2,
    );
    const cam = this.cameras.main;
    cam.setZoom(zoom);
    cam.centerOn(
      this.bounds.x + this.bounds.w / 2,
      this.bounds.y + this.bounds.h / 2,
    );
  }

  private async handleCommand(cmd: RobotCommand): Promise<void> {
    if (!this.alive) return;
    if (!this.world || !this.robot) {
      EventBus.emit("command-result", { id: cmd.id, result: null, error: "no-level" });
      return;
    }
    if (this.busy) {
      EventBus.emit("command-result", { id: cmd.id, result: null, error: "busy" });
      return;
    }

    this.busy = true;
    let result: ActionResult | null = null;
    try {
      if (cmd.action === "reset") {
        this.loadLevel(this.world.getLevel());
      } else {
        result = this.world.apply(cmd.action);
        await this.playResult(cmd.action, result);
        if (result.complete) {
          const p = project(result.snapshot.pos);
          playSfx("success");
          burst(this, p.x, p.y - 30, CONFETTI, 18, 80);
          await this.robot.celebrate();
        }
      }
    } finally {
      this.busy = false;
    }

    EventBus.emit("command-result", { id: cmd.id, result });
    if (result?.complete && this.world) {
      EventBus.emit("level-complete", {
        levelId: this.world.getLevel().id,
        starsCollected: this.world.starsCollected(),
        starsTotal: this.world.starsTotal(),
      });
    }
  }

  private async playResult(action: RobotAction, result: ActionResult): Promise<void> {
    const robot = this.robot;
    if (!robot) return;
    const { pos, dir } = result.snapshot;

    switch (action) {
      case "forward":
        if (result.ok) {
          playSfx("move");
          await robot.moveTo(pos);
          const p = project(pos);
          pulse(this, p.x, p.y);
        } else {
          playSfx("bump");
          await robot.bump(dir);
        }
        break;
      case "left":
      case "right":
        playSfx("turn");
        await robot.turnTo(dir);
        break;
      case "wait":
        await robot.wait();
        break;
      case "collect":
        if (result.collectedId) {
          playSfx("collect");
          await this.playCollect(result.collectedId);
        } else {
          await robot.nod();
        }
        break;
      case "interact": {
        const toggled = result.toggledGateIds ?? [];
        if (toggled.length > 0) playSfx("interact");
        const flashes: Promise<void>[] = [];
        for (const id of toggled) {
          const view = this.objectViews.get(id);
          if (view && this.world) {
            redrawGate(view, this.world.isGateOpen(id));
            flashes.push(
              tweenAsync(this, {
                targets: view.gfx,
                alpha: 0.35,
                duration: 90,
                yoyo: true,
              }),
            );
          }
        }
        await Promise.all([robot.nod(), ...flashes]);
        break;
      }
    }
  }

  private async playCollect(id: string): Promise<void> {
    const view = this.objectViews.get(id);
    if (!view) return;
    this.objectViews.delete(id);
    this.tweens.killTweensOf(view.gfx);
    burst(this, view.gfx.x, view.gfx.y - 26, [0xffc21a, 0xffd54a, 0xffffff], 8, 40);
    await tweenAsync(this, {
      targets: view.gfx,
      y: view.gfx.y - 28,
      alpha: 0,
      scale: 1.5,
      duration: 240,
    });
    view.gfx.destroy();
  }
}