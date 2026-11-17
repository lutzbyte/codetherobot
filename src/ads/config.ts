export type AdsMode = "off" | "test" | "live";

export interface AdSlots {
  world: string | null;
  play: string | null;
}

export interface AdsConfig {
  mode: AdsMode;
  client: string | null;
  /** ID unit iklan display untuk banner. Null = banner tidak tampil. */
  slots: AdSlots;
  /** Alasan jika mode yang diminta dikembalikan ke "off". */
  reason?: string;
}

const CLIENT_FORMAT = /^ca-pub-\d{10,20}$/;
const SLOT_FORMAT = /^\d{6,15}$/;
const NO_SLOTS: AdSlots = { world: null, play: null };

function slotOf(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return SLOT_FORMAT.test(text) ? text : null;
}

/** Membaca konfigurasi iklan dari environment. Murni, sehingga mudah diuji. */
export function parseAdsConfig(env: {
  VITE_ADS_MODE?: unknown;
  VITE_ADSENSE_CLIENT?: unknown;
  VITE_ADSENSE_SLOT_WORLD?: unknown;
  VITE_ADSENSE_SLOT_PLAY?: unknown;
}): AdsConfig {
  const requested: AdsMode =
    env.VITE_ADS_MODE === "test" || env.VITE_ADS_MODE === "live"
      ? env.VITE_ADS_MODE
      : "off";
  if (requested === "off") return { mode: "off", client: null, slots: NO_SLOTS };

  const client =
    typeof env.VITE_ADSENSE_CLIENT === "string" ? env.VITE_ADSENSE_CLIENT.trim() : "";
  if (!CLIENT_FORMAT.test(client)) {
    return {
      mode: "off",
      client: null,
      slots: NO_SLOTS,
      reason: "VITE_ADSENSE_CLIENT is missing or invalid (expected ca-pub-<digits>).",
    };
  }
  return {
    mode: requested,
    client,
    slots: {
      world: slotOf(env.VITE_ADSENSE_SLOT_WORLD),
      play: slotOf(env.VITE_ADSENSE_SLOT_PLAY),
    },
  };
}

export function readAdsConfig(): AdsConfig {
  return parseAdsConfig(import.meta.env);
}