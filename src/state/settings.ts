import { useSyncExternalStore } from "react";
import { resetProgressState } from "@/progress/progress";
import { DEFAULT_SETTINGS, parseSettings } from "./settingsLogic";
import type { Settings } from "./settingsLogic";

export type { Language, Settings } from "./settingsLogic";

const STORAGE_KEY = "ctr:settings";
const KEY_PREFIX = "ctr:";
/** Opsi uji "Unlock all levels" hanya ada pada build development, tidak pada produksi. */
const ALLOW_UNLOCK_ALL = import.meta.env.DEV;

function read(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseSettings(raw ? JSON.parse(raw) : null, ALLOW_UNLOCK_ALL);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let current: Settings = read();
const listeners = new Set<() => void>();

function applyMotion(s: Settings): void {
  document.documentElement.dataset.motion = s.animations ? "on" : "off";
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* penyimpanan penuh atau diblokir: pengaturan tetap berlaku di sesi ini */
  }
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

applyMotion(current);

export function updateSettings(patch: Partial<Settings>): void {
  const merged = { ...current, ...patch };
  current = { ...merged, unlockAll: ALLOW_UNLOCK_ALL && merged.unlockAll };
  persist();
  applyMotion(current);
  emit();
}

/** Menghapus semua data game (kunci berawalan "ctr:") dan mengembalikan pengaturan ke default. */
export function resetAllProgress(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    /* diabaikan: penyimpanan tidak tersedia */
  }
  resetProgressState();
  current = { ...DEFAULT_SETTINGS };
  applyMotion(current);
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Settings {
  return current;
}

/** Pembacaan sinkron di luar React (dipakai engine audio). */
export function getSettings(): Settings {
  return current;
}

export function subscribeSettings(listener: () => void): () => void {
  return subscribe(listener);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSnapshot);
}