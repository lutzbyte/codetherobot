import { describe, expect, test } from "bun:test";
import {
  STEPS_PER_LOOP,
  buildMusic,
  buildMusicSteps,
  musicLoopSeconds,
} from "./music";

describe("background music", () => {
  test("every note is valid and stays inside the loop", () => {
    for (const note of buildMusic()) {
      expect(note.step).toBeGreaterThanOrEqual(0);
      expect(note.step).toBeLessThan(STEPS_PER_LOOP);
      expect(note.freq).toBeGreaterThanOrEqual(40);
      expect(note.freq).toBeLessThanOrEqual(2000);
      expect(note.gain).toBeGreaterThan(0);
      expect(note.gain).toBeLessThanOrEqual(0.1);
      expect(note.dur).toBeGreaterThan(0);
    }
  });

  test("every step of the loop has at least one note", () => {
    const steps = buildMusicSteps();
    expect(steps.length).toBe(STEPS_PER_LOOP);
    expect(steps.every((notes) => notes.length > 0)).toBe(true);
  });

  test("the loop lasts ten seconds and is deterministic", () => {
    expect(musicLoopSeconds()).toBeCloseTo(10, 5);
    expect(JSON.stringify(buildMusic())).toBe(JSON.stringify(buildMusic()));
  });
});