import { WORLDS } from "@/data/uiData";

export const SITE_NAME = "Code the Robot";

export const DEFAULT_DESCRIPTION =
  "Code the Robot is a free programming puzzle game. Guide a robot with loops, conditions, functions and variables across 75 levels. Think. Code. Execute.";

export interface PageMeta {
  title: string;
  description: string;
  /** False untuk halaman pribadi atau dinamis yang tidak perlu diindeks. */
  indexable: boolean;
}

const page = (title: string, description: string): PageMeta => ({
  title,
  description,
  indexable: true,
});

const PUBLIC_PAGES: Record<string, PageMeta> = {
  "/": page("Code the Robot: Free Programming Puzzle Game", DEFAULT_DESCRIPTION),
  "/worlds": page(
    `Worlds | ${SITE_NAME}`,
    "Choose from 5 worlds and 75 programming puzzles: movement, loops, decisions, functions and advanced logic.",
  ),
  "/daily": page(
    `Daily Challenge | ${SITE_NAME}`,
    "Solve a new programming puzzle every day. Build streaks, finish the weekly challenge and try endless, time and minimum-command modes.",
  ),
  "/how-to-play": page(
    `How to Play | ${SITE_NAME}`,
    "Learn how to build programs, read the board, earn stars and coins, and debug your robot's moves in Code the Robot.",
  ),
  "/about": page(
    `About | ${SITE_NAME}`,
    "Learn how Code the Robot teaches sequences, loops, conditions, functions and variables through puzzles.",
  ),
  "/privacy": page(
    `Privacy Policy | ${SITE_NAME}`,
    "How Code the Robot stores your progress on your device and how advertising works in the game.",
  ),
  "/terms": page(
    `Terms of Service | ${SITE_NAME}`,
    "The rules for playing Code the Robot: personal use, virtual items, advertising and how we handle changes.",
  ),
  "/disclaimer": page(
    `Disclaimer | ${SITE_NAME}`,
    "Important notes about Code the Robot: its educational scope, third-party ads and the limits of what the game promises.",
  ),
  "/contact": page(
    `Contact | ${SITE_NAME}`,
    "Report a bug, ask a question or send feedback about Code the Robot, and see which details help us fix problems quickly.",
  ),
};

const PRIVATE_PAGES: Record<string, string> = {
  "/achievements": "Achievements",
  "/collection": "Robot Collection",
  "/settings": "Settings",
  "/complete": "Level Complete",
};

const notIndexed = (title: string): PageMeta => ({
  title: `${title} | ${SITE_NAME}`,
  description: DEFAULT_DESCRIPTION,
  indexable: false,
});

/** Judul, deskripsi, dan status indeks untuk sebuah path. Murni, sehingga mudah diuji. */
export function metaForPath(pathname: string): PageMeta {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  const fixed = PUBLIC_PAGES[path];
  if (fixed) return fixed;

  const world = /^\/worlds\/(\d+)$/.exec(path);
  if (world) {
    const found = WORLDS.find((w) => String(w.id) === world[1]);
    if (!found) return notIndexed("Page not found");
    return page(
      `${found.title} (World ${found.id}) | ${SITE_NAME}`,
      `${found.description} 15 programming puzzles to solve with code.`,
    );
  }

  const privateTitle = PRIVATE_PAGES[path];
  if (privateTitle) return notIndexed(privateTitle);
  if (path.startsWith("/play/")) return notIndexed("Play");
  if (path.startsWith("/challenge/")) return notIndexed("Challenge");

  return notIndexed("Page not found");
}