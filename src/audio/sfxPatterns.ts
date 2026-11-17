export type Wave = "sine" | "square" | "triangle" | "sawtooth";

export interface Tone {
  freq: number;
  /** Detik sejak efek dimulai. */
  start: number;
  dur: number;
  wave: Wave;
  gain: number;
  /** Frekuensi akhir untuk nada yang meluncur. */
  slideTo?: number;
}

export interface Noise {
  start: number;
  dur: number;
  gain: number;
  lowpass?: number;
}

export interface SfxPattern {
  tones: readonly Tone[];
  noise?: readonly Noise[];
}

export type SfxName =
  | "click"
  | "add"
  | "remove"
  | "move"
  | "turn"
  | "bump"
  | "collect"
  | "interact"
  | "star"
  | "success"
  | "fail"
  | "unlock"
  | "coin"
  | "levelUp"
  | "pause";

const t = (
  freq: number,
  start: number,
  dur: number,
  wave: Wave,
  gain: number,
  slideTo?: number,
): Tone => ({ freq, start, dur, wave, gain, slideTo });

/** Efek suara sebagai data murni: semuanya disintesis oleh engine audio. */
export const SFX: Record<SfxName, SfxPattern> = {
  click: { tones: [t(880, 0, 0.05, "sine", 0.12, 660)] },
  add: { tones: [t(660, 0, 0.07, "triangle", 0.15), t(880, 0.05, 0.08, "triangle", 0.15)] },
  remove: { tones: [t(520, 0, 0.09, "triangle", 0.14, 330)] },
  move: { tones: [t(190, 0, 0.1, "sine", 0.2, 120)] },
  turn: { tones: [t(420, 0, 0.08, "triangle", 0.12, 520)] },
  bump: {
    tones: [t(110, 0, 0.14, "square", 0.14, 70)],
    noise: [{ start: 0, dur: 0.07, gain: 0.1, lowpass: 500 }],
  },
  collect: { tones: [t(880, 0, 0.09, "sine", 0.18), t(1320, 0.07, 0.14, "sine", 0.18)] },
  interact: { tones: [t(300, 0, 0.06, "square", 0.1), t(600, 0.06, 0.1, "square", 0.1)] },
  star: { tones: [t(988, 0, 0.14, "triangle", 0.18), t(1319, 0.06, 0.16, "triangle", 0.12)] },
  success: {
    tones: [
      t(523, 0, 0.18, "sine", 0.2),
      t(659, 0.1, 0.18, "sine", 0.2),
      t(784, 0.2, 0.18, "sine", 0.2),
      t(1047, 0.3, 0.3, "sine", 0.2),
    ],
  },
  fail: {
    tones: [t(330, 0, 0.16, "sawtooth", 0.1, 220), t(220, 0.14, 0.22, "sawtooth", 0.1, 150)],
  },
  unlock: {
    tones: [
      t(784, 0, 0.12, "triangle", 0.15),
      t(988, 0.08, 0.12, "triangle", 0.15),
      t(1175, 0.16, 0.12, "triangle", 0.15),
      t(1568, 0.24, 0.24, "triangle", 0.15),
    ],
  },
  coin: { tones: [t(1319, 0, 0.05, "square", 0.08), t(1760, 0.05, 0.1, "square", 0.08)] },
  levelUp: {
    tones: [
      t(523, 0, 0.1, "triangle", 0.18),
      t(659, 0.1, 0.1, "triangle", 0.18),
      t(784, 0.2, 0.1, "triangle", 0.18),
      t(1047, 0.3, 0.1, "triangle", 0.18),
      t(1319, 0.4, 0.3, "triangle", 0.18),
    ],
  },
  pause: { tones: [t(440, 0, 0.07, "sine", 0.12, 330)] },
};

export const SFX_NAMES = Object.keys(SFX) as SfxName[];