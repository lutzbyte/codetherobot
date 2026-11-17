import { setAdMute } from "@/audio";
import { getSettings, subscribeSettings } from "@/state/settings";
import { readAdsConfig } from "./config";
import type { AdsConfig, AdsMode } from "./config";
import {
  createAdState,
  noteCompletion,
  noteInterstitialShown,
  shouldShowInterstitial,
} from "./policy";

interface AdsWindow extends Window {
  adsbygoogle?: unknown[];
}

/** Bentuk placementInfo yang diberikan Ad Placement API ke adBreakDone(). */
interface PlacementInfo {
  breakType?: string;
  breakName?: string;
  breakFormat?: string;
  breakStatus?: string;
}

export interface InterstitialOutcome {
  shown: boolean;
  status: string;
}

export type RewardOutcome = "granted" | "dismissed" | "declined" | "unavailable";

/** Tawaran hadiah: dialog persetujuan pemain memanggil show() atau decline(). */
export interface RewardOffer {
  show: () => void;
  decline: () => void;
  /** True jika tidak ada iklan nyata (mode development). */
  simulated: boolean;
}

/** Batas menunggu respons API jika tidak ada iklan yang mulai tampil. */
const LOCAL_TIMEOUT_MS = 4000;

let config: AdsConfig = {
  mode: "off",
  client: null,
  slots: { world: null, play: null },
};
let scriptReady = false;
let scriptFailed = false;
let adState = createAdState();

/** Setara dengan adBreak() dan adConfig() pada dokumentasi: keduanya hanya mendorong objek ke adsbygoogle. */
function push(options: Record<string, unknown>): void {
  const w = window as AdsWindow;
  w.adsbygoogle = w.adsbygoogle ?? [];
  w.adsbygoogle.push(options);
}

function sendConfig(): void {
  push({
    preloadAdBreaks: "on",
    sound: getSettings().sound ? "on" : "off",
  });
}

export function getAdsMode(): AdsMode {
  return config.mode;
}

/**
 * Menyiapkan iklan sesuai mode. Pada mode "off" tidak ada skrip yang dimuat.
 * Mode "test" memakai data-adbreak-test="on" (iklan tiruan).
 */
export function initAds(): void {
  config = readAdsConfig();
  if (config.reason) console.warn(`[ads] ${config.reason} Ads are disabled.`);
  if (config.mode === "off" || !config.client) return;

  const w = window as AdsWindow;
  w.adsbygoogle = w.adsbygoogle ?? [];

  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.client)}`;
  if (config.mode === "test") script.setAttribute("data-adbreak-test", "on");
  script.onerror = () => {
    scriptFailed = true;
  };
  document.head.appendChild(script);

  scriptReady = true;
  // Suara harus dilaporkan segera setiap kali berubah, agar API memilih jenis iklan yang sesuai.
  sendConfig();
  subscribeSettings(sendConfig);
}

function adsAvailable(): boolean {
  return config.mode !== "off" && scriptReady && !scriptFailed;
}

/** Interstitial pada jeda alami. Promise selesai saat adBreakDone dipanggil. */
export function showInterstitial(
  name: string,
  type: "next" | "start" | "browse" = "next",
): Promise<InterstitialOutcome> {
  if (!adsAvailable()) return Promise.resolve({ shown: false, status: "disabled" });

  return new Promise<InterstitialOutcome>((resolve) => {
    let started = false;
    let done = false;
    let timer: number | undefined;

    const finish = (outcome: InterstitialOutcome): void => {
      if (done) return;
      done = true;
      if (timer !== undefined) window.clearTimeout(timer);
      resolve(outcome);
    };

    timer = window.setTimeout(() => {
      if (!started) finish({ shown: false, status: "timeout-local" });
    }, LOCAL_TIMEOUT_MS);

    push({
      type,
      name,
      // Wajib sinkron: game dijeda dan dibisukan sebelum iklan tampil.
      beforeAd: () => {
        started = true;
        setAdMute(true);
      },
      afterAd: () => {
        setAdMute(false);
      },
      adBreakDone: (info: PlacementInfo) => {
        setAdMute(false);
        finish({ shown: info.breakStatus === "viewed", status: info.breakStatus ?? "unknown" });
      },
    });
  });
}

export function recordLevelCompleted(): void {
  adState = noteCompletion(adState);
}

/** Menampilkan interstitial hanya jika kebijakan frekuensi mengizinkan. Mengembalikan true jika iklan tampil. */
export async function maybeShowInterstitial(name: string): Promise<boolean> {
  if (!adsAvailable()) return false;
  if (!shouldShowInterstitial(adState, Date.now())) return false;
  const outcome = await showInterstitial(name, "next");
  if (outcome.shown) adState = noteInterstitialShown(adState, Date.now());
  return outcome.shown;
}

/**
 * Rewarded ad. onOffer dipanggil saat iklan siap ditawarkan; UI harus meminta
 * persetujuan pemain lalu memanggil offer.show() atau offer.decline().
 * Hadiah hanya boleh diberikan jika hasilnya "granted" (callback adViewed).
 * Pada mode "off" iklan disimulasikan agar fitur bisa diuji tanpa iklan nyata.
 */
export function requestReward(
  name: string,
  onOffer: (offer: RewardOffer) => void,
): Promise<RewardOutcome> {
  if (config.mode === "off") {
    return new Promise<RewardOutcome>((resolve) => {
      onOffer({
        simulated: true,
        show: () => resolve("granted"),
        decline: () => resolve("declined"),
      });
    });
  }
  if (!adsAvailable()) return Promise.resolve("unavailable");

  return new Promise<RewardOutcome>((resolve) => {
    let settled = false;
    let offered = false;
    let timer: number | undefined;

    const settle = (outcome: RewardOutcome): void => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      resolve(outcome);
    };

    timer = window.setTimeout(() => {
      if (!offered) settle("unavailable");
    }, LOCAL_TIMEOUT_MS);

    push({
      type: "reward",
      name,
      beforeAd: () => {
        setAdMute(true);
      },
      afterAd: () => {
        setAdMute(false);
      },
      beforeReward: (showAdFn: () => void) => {
        offered = true;
        if (timer !== undefined) window.clearTimeout(timer);
        onOffer({
          simulated: false,
          show: () => showAdFn(),
          decline: () => settle("declined"),
        });
      },
      adDismissed: () => settle("dismissed"),
      adViewed: () => settle("granted"),
      // Selalu dipanggil terakhir. Jika belum ada hasil, berarti iklan tidak tampil.
      adBreakDone: () => {
        setAdMute(false);
        settle("unavailable");
      },
    });
  });
}