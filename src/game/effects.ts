import type Phaser from "phaser";
import { reducedMotion } from "./anim";
import { starPolygon } from "./draw";

/** Ledakan partikel kecil. Dilewati jika gerakan dikurangi. */
export function burst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  colors: readonly number[],
  count: number,
  spread: number,
): void {
  if (reducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = spread * (0.6 + Math.random() * 0.4);
    const g = scene.add.graphics({ x, y });
    g.setDepth(y + 1000);
    g.fillStyle(colors[i % colors.length] ?? 0xffffff, 1);
    if (i % 3 === 0) g.fillPoints(starPolygon(0, 0, 6), true);
    else g.fillCircle(0, 0, 3.5);
    scene.tweens.add({
      targets: g,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist * 0.6 - 10,
      alpha: 0,
      scale: 0.4,
      duration: 450 + Math.random() * 150,
      ease: "Cubic.easeOut",
      onComplete: () => g.destroy(),
    });
  }
}

/** Cincin yang melebar di atas tile (di bawah objek dan robot). */
export function pulse(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color = 0xffffff,
): void {
  if (reducedMotion()) return;
  const g = scene.add.graphics({ x, y });
  g.setDepth(-99999);
  g.lineStyle(3, color, 0.85);
  g.strokeEllipse(0, 0, 60, 30);
  scene.tweens.add({
    targets: g,
    scale: 1.8,
    alpha: 0,
    duration: 360,
    ease: "Cubic.easeOut",
    onComplete: () => g.destroy(),
  });
}