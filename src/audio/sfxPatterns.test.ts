import { describe, expect, test } from "bun:test";
import { SFX, SFX_NAMES } from "./sfxPatterns";

describe("sound effects", () => {
  test("every effect is short, audible and within a sane frequency range", () => {
    const problems: string[] = [];
    for (const name of SFX_NAMES) {
      const pattern = SFX[name];
      if (pattern.tones.length === 0) problems.push(`${name}: no tones`);

      let end = 0;
      for (const tone of pattern.tones) {
        const freqs = [tone.freq, tone.slideTo ?? tone.freq];
        if (freqs.some((f) => f < 40 || f > 8000)) problems.push(`${name}: frequency out of range`);
        if (tone.dur <= 0 || tone.dur > 0.6) problems.push(`${name}: bad duration`);
        if (tone.gain <= 0 || tone.gain > 0.4) problems.push(`${name}: bad gain`);
        end = Math.max(end, tone.start + tone.dur);
      }
      for (const n of pattern.noise ?? []) {
        if (n.dur <= 0 || n.gain <= 0 || n.gain > 0.4) problems.push(`${name}: bad noise`);
        end = Math.max(end, n.start + n.dur);
      }
      if (end > 1.2) problems.push(`${name}: longer than 1.2s`);
    }
    expect(problems).toEqual([]);
  });

  test("all effects used by the game exist", () => {
    const used = [
      "click",
      "add",
      "remove",
      "move",
      "turn",
      "bump",
      "collect",
      "interact",
      "star",
      "success",
      "fail",
      "unlock",
      "coin",
      "levelUp",
      "pause",
    ];
    for (const name of used) {
      expect(SFX_NAMES as string[]).toContain(name);
    }
  });
});