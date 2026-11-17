import { describe, expect, test } from "bun:test";
import {
  MIN_INTERVAL_MS,
  createAdState,
  noteCompletion,
  noteInterstitialShown,
  shouldShowInterstitial,
} from "./policy";
import type { AdState } from "./policy";

function completions(state: AdState, count: number): AdState {
  let next = state;
  for (let i = 0; i < count; i++) next = noteCompletion(next);
  return next;
}

describe("interstitial policy", () => {
  test("no interstitial before three levels were completed in the session", () => {
    expect(shouldShowInterstitial(completions(createAdState(), 2), 0)).toBe(false);
  });

  test("an interstitial is allowed after three completed levels", () => {
    expect(shouldShowInterstitial(completions(createAdState(), 3), 0)).toBe(true);
  });

  test("showing an ad resets the counters", () => {
    const shown = noteInterstitialShown(completions(createAdState(), 3), 1000);
    expect(shown.sinceLastAd).toBe(0);
    expect(shown.lastAdAt).toBe(1000);
    expect(shouldShowInterstitial(shown, 1000 + MIN_INTERVAL_MS * 2)).toBe(false);
  });

  test("the minimum interval between ads is respected", () => {
    const shown = noteInterstitialShown(completions(createAdState(), 3), 0);
    const again = completions(shown, 3);
    expect(shouldShowInterstitial(again, 30_000)).toBe(false);
    expect(shouldShowInterstitial(again, MIN_INTERVAL_MS + 1)).toBe(true);
  });
});