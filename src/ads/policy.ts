/** Kebijakan frekuensi interstitial di sisi game (API Google punya batas frekuensi sendiri). */
export const MIN_COMPLETIONS_BEFORE_FIRST = 3;
export const COMPLETIONS_BETWEEN_ADS = 3;
export const MIN_INTERVAL_MS = 90_000;

export interface AdState {
  /** Level yang diselesaikan sejak halaman dimuat. */
  sessionCompletions: number;
  /** Level yang diselesaikan sejak interstitial terakhir. */
  sinceLastAd: number;
  lastAdAt: number | null;
}

export function createAdState(): AdState {
  return { sessionCompletions: 0, sinceLastAd: 0, lastAdAt: null };
}

export function noteCompletion(state: AdState): AdState {
  return {
    ...state,
    sessionCompletions: state.sessionCompletions + 1,
    sinceLastAd: state.sinceLastAd + 1,
  };
}

export function noteInterstitialShown(state: AdState, now: number): AdState {
  return { ...state, sinceLastAd: 0, lastAdAt: now };
}

/** Interstitial hanya di jeda alami, tidak untuk pemain baru, dan tidak terlalu sering. */
export function shouldShowInterstitial(state: AdState, now: number): boolean {
  if (state.sessionCompletions < MIN_COMPLETIONS_BEFORE_FIRST) return false;
  if (state.sinceLastAd < COMPLETIONS_BETWEEN_ADS) return false;
  if (state.lastAdAt !== null && now - state.lastAdAt < MIN_INTERVAL_MS) return false;
  return true;
}