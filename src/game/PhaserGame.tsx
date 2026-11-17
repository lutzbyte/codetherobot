import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "./config";

interface PhaserGameProps {
  className?: string;
}

/**
 * Membuat Phaser.Game saat mount dan menghancurkannya saat unmount.
 * Kanvas tidak bisa dibaca pembaca layar: seluruh kontrol dan pesan status
 * tersedia lewat editor perintah di sebelahnya.
 */
export function PhaserGame({ className }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const game = new Phaser.Game(createGameConfig(container));

    return () => {
      // Memberi tahu scene agar berhenti merespons sebelum penghancuran Phaser selesai.
      game.events.emit("ctr-dispose");
      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label="Game board. Use the command editor to program the robot."
      style={{ width: "100%", height: "100%" }}
    />
  );
}