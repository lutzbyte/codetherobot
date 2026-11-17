import Phaser from "phaser";
import type { LevelObject, ObjectKind, Vec } from "@/engine/types";
import { reducedMotion } from "../anim";
import { CRATE, PURPLE, STONE, drawCube, starPolygon } from "../draw";
import { project } from "../iso";

export interface ObjectView {
  id: string;
  kind: ObjectKind;
  gfx: Phaser.GameObjects.Graphics;
}

/** Menggambar objek relatif terhadap pusat tile (0, 0). */
function paint(
  g: Phaser.GameObjects.Graphics,
  kind: ObjectKind,
  open: boolean,
): void {
  g.clear();
  switch (kind) {
    case "stone":
      drawCube(g, 0, -20, 34, 30, STONE);
      break;
    case "crate":
      drawCube(g, 0, -14, 30, 26, CRATE);
      g.lineStyle(2, 0x744623, 1);
      g.lineBetween(-30, -14, 0, 1);
      g.lineBetween(0, 1, 30, -14);
      break;
    case "tree":
      g.fillStyle(0x7a4b2a, 1);
      g.fillRoundedRect(-4, -16, 8, 24, 3);
      g.fillStyle(0x3f9a3a, 1);
      g.fillCircle(0, -36, 22);
      g.fillStyle(0x5cb84a, 1);
      g.fillCircle(-7, -44, 14);
      break;
    case "gate":
      if (open) drawCube(g, 0, -2, 34, 5, PURPLE);
      else drawCube(g, 0, -18, 34, 30, PURPLE);
      break;
    case "switch":
      drawCube(g, 0, -3, 22, 6, PURPLE);
      g.fillStyle(0xffc21a, 1);
      g.fillEllipse(0, -6, 14, 8);
      break;
    case "star":
      g.fillStyle(0xffc21a, 1);
      g.lineStyle(2, 0xc48f00, 1);
      g.fillPoints(starPolygon(0, -26, 15), true);
      g.strokePoints(starPolygon(0, -26, 15), true);
      break;
  }
}

export function createObjectView(
  scene: Phaser.Scene,
  obj: LevelObject,
  open: boolean,
): ObjectView {
  const p = project(obj.at);
  const gfx = scene.add.graphics({ x: p.x, y: p.y });
  gfx.setDepth(p.y);
  paint(gfx, obj.kind, open);

  if (obj.kind === "star" && !reducedMotion()) {
    scene.tweens.add({
      targets: gfx,
      y: p.y - 4,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  return { id: obj.id, kind: obj.kind, gfx };
}

export function redrawGate(view: ObjectView, open: boolean): void {
  paint(view.gfx, view.kind, open);
}

/** Bendera goal yang berkibar pelan (statis jika gerakan dikurangi). */
export function createGoalFlag(
  scene: Phaser.Scene,
  goal: Vec,
): Phaser.GameObjects.Graphics {
  const p = project(goal);
  const g = scene.add.graphics({ x: p.x, y: p.y });
  g.setDepth(p.y);

  const draw = (wave: number): void => {
    g.clear();
    g.lineStyle(3, 0x6b4a2a, 1);
    g.lineBetween(14, 0, 14, -62);
    g.fillStyle(0xe5483d, 1);
    g.fillTriangle(14, -62, 42 + wave * 3, -51 + wave * 2, 14, -40);
  };
  draw(0);

  if (!reducedMotion()) {
    const counter = scene.tweens.addCounter({
      from: -1,
      to: 1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => draw(tween.getValue() ?? 0),
    });
    g.once(Phaser.GameObjects.Events.DESTROY, () => {
      counter.stop();
    });
  }
  return g;
}