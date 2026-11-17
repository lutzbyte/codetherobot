import type { Section } from "./pages";

/** Bagian tambahan halaman Contact: apa yang perlu disebutkan agar masalah bisa direproduksi. */
export const CONTACT_EXTRA: readonly Section[] = [
  {
    heading: "Reproducing a bug",
    paragraphs: [
      "The 75 campaign levels are the same for every player, so a level number such as 4-6 is enough for us to open exactly the board you saw. The daily puzzle depends on the date, which makes the day you played useful to mention. Endless, Time and Minimum puzzles are built from a random seed that is not saved, so for those a short description of the island and the place where the robot got stuck helps most.",
    ],
  },
  {
    heading: "Ideas and corrections",
    paragraphs: [
      "If a guide on a world page is unclear, or a hint skips a step you needed, quote the sentence and tell us what you expected instead. Suggestions for new block types, sensors or level ideas are read too; small, specific ideas that fit the existing worlds are the easiest to act on.",
    ],
  },
];