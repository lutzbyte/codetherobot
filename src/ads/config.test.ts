import { describe, expect, test } from "bun:test";
import { parseAdsConfig } from "./config";

const NO_SLOTS = { world: null, play: null };

describe("ads configuration", () => {
  test("ads are off by default", () => {
    expect(parseAdsConfig({})).toEqual({ mode: "off", client: null, slots: NO_SLOTS });
  });

  test("live mode without a publisher id falls back to off with a reason", () => {
    const config = parseAdsConfig({ VITE_ADS_MODE: "live" });
    expect(config.mode).toBe("off");
    expect(config.reason).toBeDefined();
  });

  test("test mode with a valid publisher id is accepted", () => {
    const config = parseAdsConfig({
      VITE_ADS_MODE: "test",
      VITE_ADSENSE_CLIENT: "ca-pub-1234567890123456",
    });
    expect(config).toEqual({
      mode: "test",
      client: "ca-pub-1234567890123456",
      slots: NO_SLOTS,
    });
  });

  test("an invalid publisher id is rejected", () => {
    const config = parseAdsConfig({
      VITE_ADS_MODE: "live",
      VITE_ADSENSE_CLIENT: "ca-pub-XXXX",
    });
    expect(config.mode).toBe("off");
  });

  test("banner slots are accepted when numeric and dropped when malformed", () => {
    const config = parseAdsConfig({
      VITE_ADS_MODE: "live",
      VITE_ADSENSE_CLIENT: "ca-pub-1234567890123456",
      VITE_ADSENSE_SLOT_WORLD: "1234567890",
      VITE_ADSENSE_SLOT_PLAY: "abc",
    });
    expect(config.slots).toEqual({ world: "1234567890", play: null });
  });

  test("slots are ignored while ads are off", () => {
    const config = parseAdsConfig({ VITE_ADSENSE_SLOT_WORLD: "1234567890" });
    expect(config.slots).toEqual(NO_SLOTS);
  });
});