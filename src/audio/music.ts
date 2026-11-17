import type { Wave } from "./sfxPatterns";

export const MUSIC_BPM = 96;
export const STEPS_PER_LOOP = 32;
/** Satu langkah = nada seperdelapan. */
export const MUSIC_STEP_SECONDS = 60 / MUSIC_BPM / 2;

export interface MusicNote {
  step: number;
  freq: number;
  dur: number;
  wave: Wave;
  gain: number;
}

/** Akor C, Am, F, G dimainkan sebagai arpeggio (satu birama = 8 langkah). */
const ARPEGGIOS: readonly (readonly number[])[] = [
  [261.63, 329.63, 392.0, 329.63, 523.25, 392.0, 329.63, 392.0],
  [220.0, 261.63, 329.63, 261.63, 440.0, 329.63, 261.63, 329.63],
  [174.61, 220.0, 261.63, 220.0, 349.23, 261.63, 220.0, 261.63],
  [196.0, 246.94, 293.66, 246.94, 392.0, 293.66, 246.94, 293.66],
];

const BASS: readonly number[] = [65.41, 110.0, 87.31, 98.0];

/** [langkah, frekuensi] melodi pentatonik yang jarang. */
const MELODY: readonly (readonly [number, number])[] = [
  [2, 659.25],
  [6, 587.33],
  [10, 523.25],
  [14, 440.0],
  [18, 523.25],
  [22, 587.33],
  [26, 659.25],
  [30, 783.99],
];

export function buildMusic(): MusicNote[] {
  const notes: MusicNote[] = [];

  ARPEGGIOS.forEach((arp, bar) => {
    arp.forEach((freq, i) => {
      notes.push({
        step: bar * 8 + i,
        freq,
        dur: MUSIC_STEP_SECONDS * 0.9,
        wave: "triangle",
        gain: 0.035,
      });
    });
    const bass = BASS[bar];
    if (bass !== undefined) {
      notes.push({ step: bar * 8, freq: bass, dur: MUSIC_STEP_SECONDS * 4, wave: "sine", gain: 0.06 });
      notes.push({ step: bar * 8 + 4, freq: bass, dur: MUSIC_STEP_SECONDS * 4, wave: "sine", gain: 0.05 });
    }
  });

  for (const [step, freq] of MELODY) {
    notes.push({ step, freq, dur: MUSIC_STEP_SECONDS * 2.5, wave: "sine", gain: 0.03 });
  }

  return notes.sort((a, b) => a.step - b.step);
}

/** Catatan dikelompokkan per langkah, untuk penjadwal. */
export function buildMusicSteps(): MusicNote[][] {
  const steps: MusicNote[][] = Array.from({ length: STEPS_PER_LOOP }, () => []);
  for (const note of buildMusic()) steps[note.step]?.push(note);
  return steps;
}

export function musicLoopSeconds(): number {
  return STEPS_PER_LOOP * MUSIC_STEP_SECONDS;
}