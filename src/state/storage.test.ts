import { describe, expect, test } from "bun:test";
import { parseProgress } from "@/progress/progressLogic";
import { DEFAULT_SETTINGS, parseSettings } from "./settingsLogic";

const GARBAGE: unknown[] = [
  undefined,
  null,
  0,
  1,
  "text",
  [],
  {},
  { version: 2 },
  { version: 2, levels: [] },
  { version: 1, levels: "x" },
  { version: 2, levels: {}, achievements: 5, modes: "x", owned: "x", equipped: 7 },
];

describe("saved data hardening", () => {
  test("garbage never breaks settings and falls back to defaults", () => {
    for (const raw of GARBAGE) {
      expect(parseSettings(raw, true)).toEqual(DEFAULT_SETTINGS);
    }
  });

  test("the unlock-all test option is ignored unless it is allowed", () => {
    expect(parseSettings({ unlockAll: true }, false).unlockAll).toBe(false);
    expect(parseSettings({ unlockAll: true }, true).unlockAll).toBe(true);
  });

  test("settings only turn off for an explicit false, and the language is validated", () => {
    expect(parseSettings({ sound: "no", music: 0 }, false).sound).toBe(true);
    expect(parseSettings({ sound: "no", music: 0 }, false).music).toBe(true);
    expect(parseSettings({ sound: false }, false).sound).toBe(false);
    expect(parseSettings({ language: "fr" }, false).language).toBe("en");
    expect(parseSettings({ language: "id" }, false).language).toBe("id");
  });

  test("garbage never breaks saved progress", () => {
    for (const raw of GARBAGE) {
      const data = parseProgress(raw);
      expect(data.version).toBe(2);
      expect(Array.isArray(data.owned)).toBe(true);
      expect(data.coins).toBeGreaterThanOrEqual(0);
    }
  });
});