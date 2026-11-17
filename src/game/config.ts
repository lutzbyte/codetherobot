import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";

export function createGameConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#3d93d4",
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width: "100%",
      height: "100%",
    },
    render: { antialias: true, roundPixels: false },
    scene: [GameScene],
  };
}