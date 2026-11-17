export type WorldTheme = "grass" | "desert" | "ice" | "factory" | "space";

export const LEVELS_PER_WORLD = 15;

export interface WorldInfo {
  id: number;
  title: string;
  description: string;
  theme: WorldTheme;
}

export const WORLDS: WorldInfo[] = [
  { id: 1, title: "First Steps", description: "Learn the basics: move and reach the goal.", theme: "grass" },
  { id: 2, title: "Repetition", description: "Use loops to solve bigger challenges.", theme: "desert" },
  { id: 3, title: "Decisions", description: "Make smart choices with conditions.", theme: "ice" },
  { id: 4, title: "Functions", description: "Write reusable code with functions.", theme: "factory" },
  { id: 5, title: "Advanced Logic", description: "Master variables and algorithm optimization.", theme: "space" },
];

export function parseLevelId(id: string): { world: number; level: number } | null {
  const match = /^(\d+)-(\d+)$/.exec(id);
  if (!match) return null;
  return { world: Number(match[1]), level: Number(match[2]) };
}

/** Id level berikutnya, atau null jika ini level terakhir. */
export function nextLevelId(id: string): string | null {
  const parsed = parseLevelId(id);
  if (!parsed) return null;
  if (parsed.level < LEVELS_PER_WORLD) return `${parsed.world}-${parsed.level + 1}`;
  if (parsed.world < WORLDS.length) return `${parsed.world + 1}-1`;
  return null;
}

export function levelLabel(id: string): string {
  if (parseLevelId(id)) return `Level ${id}`;
  return id.startsWith("daily") ? "Daily Challenge" : "Challenge";
}