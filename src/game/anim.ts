import type Phaser from "phaser";

/** True jika pemain meminta gerakan dikurangi (OS atau pengaturan game). */
export function reducedMotion(): boolean {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.motion === "off"
  );
}

export function scaled(ms: number): number {
  return reducedMotion() ? 1 : ms;
}

export function tweenAsync(
  scene: Phaser.Scene,
  config: Phaser.Types.Tweens.TweenBuilderConfig,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const full: Phaser.Types.Tweens.TweenBuilderConfig = {
      ...config,
      duration: scaled(typeof config.duration === "number" ? config.duration : 200),
      onComplete: () => resolve(),
    };
    scene.tweens.add(full);
  });
}

export function delay(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    scene.time.delayedCall(scaled(ms), () => resolve());
  });
}