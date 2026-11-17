import Phaser from "phaser";
import { DIRECTION_VECTORS, turnRight } from "@/engine/level";
import type { AccessoryId, RobotLook } from "@/engine/look";
import type { Direction, Vec } from "@/engine/types";
import { delay, reducedMotion, tweenAsync } from "../anim";
import { starPolygon } from "../draw";
import { HALF_H, HALF_W, project } from "../iso";

const TEX_W = 80;
const TEX_H = 100;
const ROBOT_SCALE = 0.85;
const GROUND_OFFSET = 2;
const IMAGE_Y = 4;

/** Posisi mata per arah (di layar), supaya arah hadap robot terlihat. */
const EYE_OFFSETS: readonly (readonly [number, number])[] = [
  [3, -2],
  [3, 1],
  [-3, 1],
  [-3, -2],
];

function accentNumber(look: RobotLook): number {
  const value = Number.parseInt(look.accent.replace("#", ""), 16);
  return Number.isFinite(value) ? value : 0x2f6bdb;
}

function textureKey(look: RobotLook, dir: Direction): string {
  return `robot-${look.accent.replace("#", "")}-${look.accessory}-${dir}`;
}

function drawAccessory(
  g: Phaser.GameObjects.Graphics,
  accessory: AccessoryId,
  dx: number,
  dy: number,
): void {
  switch (accessory) {
    case "none":
      break;
    case "cap":
      g.fillStyle(0xe5483d, 1);
      g.fillRoundedRect(14, 3, 52, 13, 6);
      g.fillStyle(0xc23a30, 1);
      g.fillRoundedRect(46, 12, 26, 5, 2.5);
      break;
    case "glasses":
      g.lineStyle(2.5, 0xffc21a, 1);
      g.strokeRoundedRect(22 + dx, 26 + dy, 17, 17, 6);
      g.strokeRoundedRect(42 + dx, 26 + dy, 17, 17, 6);
      g.lineBetween(39 + dx, 34 + dy, 42 + dx, 34 + dy);
      break;
    case "bow":
      g.fillStyle(0xe8527a, 1);
      g.fillTriangle(50, 9, 62, 2, 62, 16);
      g.fillTriangle(74, 9, 62, 2, 62, 16);
      g.fillCircle(62, 9, 3.5);
      break;
    case "crown":
      g.fillStyle(0xffc21a, 1);
      g.fillRect(24, 6, 32, 6);
      g.fillTriangle(24, 6, 28, 0, 32, 6);
      g.fillTriangle(34, 6, 40, 0, 46, 6);
      g.fillTriangle(48, 6, 52, 0, 56, 6);
      break;
  }
}

/** Membuat tekstur robot untuk keempat arah sesuai tampilan (warna dan aksesori). */
export function createRobotTextures(scene: Phaser.Scene, look: RobotLook): void {
  const accent = accentNumber(look);
  for (let d = 0; d < 4; d++) {
    const key = textureKey(look, d as Direction);
    if (scene.textures.exists(key)) continue;
    const [dx, dy] = EYE_OFFSETS[d] ?? [0, 0];
    const g = scene.make.graphics({}, false);

    g.fillStyle(0x16213e, 1);
    g.fillRoundedRect(29, 74, 10, 14, 4);
    g.fillRoundedRect(43, 74, 10, 14, 4);
    g.fillRoundedRect(22, 86, 20, 10, 5);
    g.fillRoundedRect(40, 86, 20, 10, 5);

    g.fillStyle(0xffffff, 1);
    g.lineStyle(2, 0xcfd7ea, 1);
    g.fillRoundedRect(14, 52, 9, 24, 4);
    g.strokeRoundedRect(14, 52, 9, 24, 4);
    g.fillRoundedRect(57, 52, 9, 24, 4);
    g.strokeRoundedRect(57, 52, 9, 24, 4);
    g.fillStyle(0x16213e, 1);
    g.fillCircle(18, 78, 4);
    g.fillCircle(62, 78, 4);

    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(24, 48, 32, 32, 12);
    g.strokeRoundedRect(24, 48, 32, 32, 12);
    g.fillStyle(accent, 1);
    g.fillCircle(40, 64, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(40, 64, 2.2);

    g.lineStyle(3, 0x16213e, 1);
    g.lineBetween(40, 12, 40, 4);
    g.fillStyle(accent, 1);
    g.fillCircle(40, 3, 3.5);

    g.fillStyle(0x2a3b68, 1);
    g.fillCircle(9, 34, 6);
    g.fillCircle(71, 34, 6);
    g.fillStyle(accent, 1);
    g.fillCircle(9, 34, 2.4);
    g.fillCircle(71, 34, 2.4);

    g.fillStyle(0xffffff, 1);
    g.lineStyle(2, 0xcfd7ea, 1);
    g.fillRoundedRect(10, 12, 60, 44, 18);
    g.strokeRoundedRect(10, 12, 60, 44, 18);
    g.fillStyle(0x12203f, 1);
    g.fillRoundedRect(18, 20, 44, 28, 13);

    g.fillStyle(0x2ee6ff, 1);
    g.fillEllipse(30 + dx, 33 + dy, 9, 12);
    g.fillEllipse(50 + dx, 33 + dy, 9, 12);
    g.lineStyle(2.4, 0x2ee6ff, 1);
    g.beginPath();
    g.arc(40 + dx, 36 + dy, 7, 0.25 * Math.PI, 0.75 * Math.PI, false);
    g.strokePath();

    drawAccessory(g, look.accessory, dx, dy);

    g.generateTexture(key, TEX_W, TEX_H);
    g.destroy();
  }
}

/** Vektor arah di layar (belum dinormalisasi), mengikuti proyeksi isometrik. */
function rawScreen(dir: Direction): { x: number; y: number } {
  const d = DIRECTION_VECTORS[dir] ?? { r: 0, c: 0 };
  return { x: (d.c - d.r) * HALF_W, y: (d.c + d.r) * HALF_H };
}

export class RobotSprite {
  private readonly scene: Phaser.Scene;
  private readonly look: RobotLook;
  private readonly container: Phaser.GameObjects.Container;
  private readonly image: Phaser.GameObjects.Image;
  private readonly arrow: Phaser.GameObjects.Graphics;
  private dir: Direction;

  constructor(scene: Phaser.Scene, at: Vec, dir: Direction, look: RobotLook) {
    this.scene = scene;
    this.look = look;
    this.dir = dir;
    const p = project(at);

    const shadow = scene.add.ellipse(0, 0, 46, 18, 0x000000, 0.22);
    this.arrow = scene.add.graphics();
    this.image = scene.add
      .image(0, IMAGE_Y, textureKey(look, dir))
      .setOrigin(0.5, 1)
      .setScale(ROBOT_SCALE);
    this.container = scene.add.container(p.x, p.y + GROUND_OFFSET, [
      shadow,
      this.arrow,
      this.image,
    ]);
    this.container.setDepth(this.container.y + 1);
    this.drawArrow();
  }

  private drawArrow(): void {
    const v = rawScreen(this.dir);
    const side = rawScreen(turnRight(this.dir));
    const tip = { x: v.x * 0.62, y: v.y * 0.62 };
    const base = { x: v.x * 0.34, y: v.y * 0.34 };
    const s = { x: side.x * 0.14, y: side.y * 0.14 };
    this.arrow.clear();
    this.arrow.fillStyle(0xffc21a, 0.95);
    this.arrow.fillTriangle(
      tip.x,
      tip.y,
      base.x + s.x,
      base.y + s.y,
      base.x - s.x,
      base.y - s.y,
    );
  }

  private updateDepth(): void {
    this.container.setDepth(this.container.y + 1);
  }

  /** Jejak kecil di belakang robot saat berjalan (dimatikan jika gerakan dikurangi). */
  private spawnTrail(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void {
    const kind = this.look.trail;
    if (kind === "none" || reducedMotion()) return;

    for (let i = 0; i < 3; i++) {
      const t = i / 3;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      this.scene.time.delayedCall(i * 70, () => {
        const g = this.scene.add.graphics({ x, y });
        g.setDepth(y);
        if (kind === "dots") {
          g.fillStyle(0xffffff, 0.85);
          g.fillCircle(0, 0, 5);
        } else if (kind === "stars") {
          g.fillStyle(0xffc21a, 1);
          g.fillPoints(starPolygon(0, 0, 8), true);
        } else {
          g.fillStyle(0xf5882a, 1);
          g.fillCircle(0, 0, 4);
          g.fillStyle(0xffd54a, 1);
          g.fillCircle(2, -2, 2);
        }
        this.scene.tweens.add({
          targets: g,
          alpha: 0,
          scale: 0.3,
          duration: 450,
          onComplete: () => g.destroy(),
        });
      });
    }
  }

  async moveTo(v: Vec): Promise<void> {
    const p = project(v);
    this.spawnTrail(
      { x: this.container.x, y: this.container.y },
      { x: p.x, y: p.y + GROUND_OFFSET },
    );
    await Promise.all([
      tweenAsync(this.scene, {
        targets: this.container,
        x: p.x,
        y: p.y + GROUND_OFFSET,
        duration: 260,
        ease: "Sine.easeInOut",
        onUpdate: () => this.updateDepth(),
      }),
      tweenAsync(this.scene, {
        targets: this.image,
        y: IMAGE_Y - 8,
        duration: 130,
        yoyo: true,
        ease: "Sine.easeOut",
      }),
    ]);
    this.updateDepth();
  }

  async turnTo(dir: Direction): Promise<void> {
    this.dir = dir;
    this.image.setTexture(textureKey(this.look, dir));
    this.drawArrow();
    await tweenAsync(this.scene, {
      targets: this.image,
      scaleX: ROBOT_SCALE * 0.85,
      duration: 90,
      yoyo: true,
    });
  }

  /** Menabrak sesuatu: maju sedikit lalu kembali. */
  async bump(dir: Direction): Promise<void> {
    const v = rawScreen(dir);
    await tweenAsync(this.scene, {
      targets: this.container,
      x: this.container.x + v.x * 0.16,
      y: this.container.y + v.y * 0.16,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeOut",
      onUpdate: () => this.updateDepth(),
    });
    this.updateDepth();
  }

  async nod(): Promise<void> {
    await tweenAsync(this.scene, {
      targets: this.image,
      y: IMAGE_Y - 5,
      duration: 90,
      yoyo: true,
    });
  }

  async wait(): Promise<void> {
    await delay(this.scene, 220);
  }

  async celebrate(): Promise<void> {
    await tweenAsync(this.scene, {
      targets: this.image,
      y: IMAGE_Y - 16,
      duration: 140,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeOut",
    });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf([this.container, this.image]);
    this.container.destroy();
  }
}