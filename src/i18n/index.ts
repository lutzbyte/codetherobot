import { useCallback } from "react";
import { useSettings } from "@/state/settings";
import type { Language } from "@/state/settings";

const EN = {
  "nav.home": "Home",
  "nav.play": "Play",
  "nav.worlds": "Worlds",
  "nav.achievements": "Achievements",
  "nav.settings": "Settings",

  "settings.title": "Settings",
  "settings.subtitle": "Sound, motion and data",
  "settings.sound": "Sound effects",
  "settings.soundDesc": "Button clicks and robot sounds.",
  "settings.music": "Music",
  "settings.musicDesc": "Background music while you play.",
  "settings.animations": "Animations",
  "settings.animationsDesc": "Turn off to reduce motion everywhere.",
  "settings.language": "Language",
  "settings.languageDesc": "Applies to menus. Puzzle hints stay in English for now.",
  "settings.unlock": "Unlock all levels",
  "settings.unlockDesc": "Testing aid: opens every world and level.",
  "settings.reset": "Reset progress",
  "settings.resetDesc": "Deletes saved stars, coins and unlocks on this device.",
  "settings.resetDone": "Progress was reset.",
  "settings.confirmTitle": "Reset all progress?",
  "settings.confirmBody":
    "This cannot be undone. All stars, coins and unlocks on this device will be removed.",
  "settings.confirmYes": "Yes, reset",
  "common.cancel": "Cancel",

  "ach.title": "Achievements",
  "ach.subtitle": "{done} of {total} unlocked",
  "ach.done": "Done",
  "ach.reward": "+{coins} coins",
  "ach.level": "Level {level}",
  "ach.xp": "{current} / {needed} XP",

  "col.title": "Robot Collection",
  "col.subtitle": "Customize your robot",
  "col.skin": "Colors",
  "col.accessory": "Accessories",
  "col.trail": "Trails",
  "col.equipped": "Equipped",
  "col.owned": "Owned",
  "col.buy": "{cost} coins",
  "col.needCoins": "Not enough coins yet.",
  "col.locked": "Unlock: {name}",

  "daily.title": "Daily Challenge",
  "daily.subtitle": "A new puzzle every day",
  "daily.today": "Today's Puzzle",
  "daily.done": "Completed with {stars} stars",
  "daily.reset": "Resets in about {hours}h.",
  "daily.reward": "Reward: +{coins} coins, +{xp} XP",
  "daily.start": "Start",
  "daily.again": "Play again",
  "daily.streak": "Streak: {days} days",

  "weekly.title": "Weekly Challenge",
  "weekly.desc": "Complete the daily puzzle on {target} days this week.",
  "weekly.progress": "{done} / {target} days",
  "weekly.claim": "Claim reward",
  "weekly.claimed": "Reward claimed",
  "weekly.reward": "Reward: +{coins} coins, +{xp} XP",

  "modes.endless": "Endless Puzzle",
  "modes.endlessDesc": "Puzzles keep coming. You have 3 lives.",
  "modes.time": "Time Challenge",
  "modes.timeDesc": "Solve it before the clock runs out.",
  "modes.minimum": "Minimum Commands",
  "modes.minimumDesc": "Reach the goal with the fewest blocks.",
  "modes.best": "Best: {value}",
  "modes.none": "No record yet",
  "modes.play": "Play",
} as const;

export type TextKey = keyof typeof EN;

const ID: Record<TextKey, string> = {
  "nav.home": "Beranda",
  "nav.play": "Main",
  "nav.worlds": "Dunia",
  "nav.achievements": "Pencapaian",
  "nav.settings": "Pengaturan",

  "settings.title": "Pengaturan",
  "settings.subtitle": "Suara, gerak, dan data",
  "settings.sound": "Efek suara",
  "settings.soundDesc": "Bunyi tombol dan robot.",
  "settings.music": "Musik",
  "settings.musicDesc": "Musik latar saat bermain.",
  "settings.animations": "Animasi",
  "settings.animationsDesc": "Matikan untuk mengurangi gerakan di mana-mana.",
  "settings.language": "Bahasa",
  "settings.languageDesc": "Berlaku untuk menu. Petunjuk puzzle masih berbahasa Inggris.",
  "settings.unlock": "Buka semua level",
  "settings.unlockDesc": "Alat uji: membuka semua dunia dan level.",
  "settings.reset": "Reset progres",
  "settings.resetDesc": "Menghapus bintang, koin, dan level yang terbuka di perangkat ini.",
  "settings.resetDone": "Progres sudah direset.",
  "settings.confirmTitle": "Reset semua progres?",
  "settings.confirmBody":
    "Tindakan ini tidak bisa dibatalkan. Semua bintang, koin, dan level terbuka di perangkat ini akan dihapus.",
  "settings.confirmYes": "Ya, reset",
  "common.cancel": "Batal",

  "ach.title": "Pencapaian",
  "ach.subtitle": "{done} dari {total} terbuka",
  "ach.done": "Selesai",
  "ach.reward": "+{coins} koin",
  "ach.level": "Level {level}",
  "ach.xp": "{current} / {needed} XP",

  "col.title": "Koleksi Robot",
  "col.subtitle": "Sesuaikan robotmu",
  "col.skin": "Warna",
  "col.accessory": "Aksesori",
  "col.trail": "Jejak",
  "col.equipped": "Dipakai",
  "col.owned": "Dimiliki",
  "col.buy": "{cost} koin",
  "col.needCoins": "Koin belum cukup.",
  "col.locked": "Buka: {name}",

  "daily.title": "Tantangan Harian",
  "daily.subtitle": "Puzzle baru setiap hari",
  "daily.today": "Puzzle Hari Ini",
  "daily.done": "Selesai dengan {stars} bintang",
  "daily.reset": "Berganti dalam sekitar {hours} jam.",
  "daily.reward": "Hadiah: +{coins} koin, +{xp} XP",
  "daily.start": "Mulai",
  "daily.again": "Main lagi",
  "daily.streak": "Beruntun: {days} hari",

  "weekly.title": "Tantangan Mingguan",
  "weekly.desc": "Selesaikan puzzle harian pada {target} hari minggu ini.",
  "weekly.progress": "{done} / {target} hari",
  "weekly.claim": "Ambil hadiah",
  "weekly.claimed": "Hadiah sudah diambil",
  "weekly.reward": "Hadiah: +{coins} koin, +{xp} XP",

  "modes.endless": "Puzzle Tanpa Akhir",
  "modes.endlessDesc": "Puzzle terus datang. Kamu punya 3 nyawa.",
  "modes.time": "Tantangan Waktu",
  "modes.timeDesc": "Selesaikan sebelum waktu habis.",
  "modes.minimum": "Perintah Minimum",
  "modes.minimumDesc": "Capai tujuan dengan blok paling sedikit.",
  "modes.best": "Terbaik: {value}",
  "modes.none": "Belum ada rekor",
  "modes.play": "Main",
};

export type TextVars = Record<string, string | number>;

export function translate(language: Language, key: TextKey, vars?: TextVars): string {
  const dict: Record<TextKey, string> = language === "id" ? ID : EN;
  return dict[key].replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = vars?.[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}

export function useT(): (key: TextKey, vars?: TextVars) => string {
  const { language } = useSettings();
  return useCallback(
    (key: TextKey, vars?: TextVars) => translate(language, key, vars),
    [language],
  );
}