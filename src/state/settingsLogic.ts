export type Language = "en" | "id";

export interface Settings {
  sound: boolean;
  music: boolean;
  animations: boolean;
  language: Language;
  /** Alat uji: membuka semua level. Hanya berlaku pada build development. */
  unlockAll: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: true,
  animations: true,
  language: "en",
  unlockAll: false,
};

/**
 * Membaca pengaturan tersimpan dengan aman. Nilai yang rusak atau tidak dikenal
 * diganti dengan default, dan opsi uji hanya berlaku jika diizinkan.
 */
export function parseSettings(raw: unknown, allowUnlockAll: boolean): Settings {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_SETTINGS };
  const r = raw as Record<string, unknown>;
  return {
    sound: r.sound !== false,
    music: r.music !== false,
    animations: r.animations !== false,
    language: r.language === "id" ? "id" : "en",
    unlockAll: allowUnlockAll && r.unlockAll === true,
  };
}