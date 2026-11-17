import { describe, expect, test } from "bun:test";
import { CONTACT_EXTRA } from "./contactExtra";
import { ABOUT, CONTACT, DISCLAIMER, HOW_TO_PLAY, PRIVACY, TERMS } from "./pages";
import type { Section } from "./pages";
import { WORLD_GUIDES } from "./worldGuides";

const words = (text: string): number => text.split(/\s+/).filter(Boolean).length;

function textOf(sections: readonly Section[]): string[] {
  return sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.items ?? [])]);
}

const PAGES: Record<string, { sections: readonly Section[]; minWords: number }> = {
  howToPlay: { sections: HOW_TO_PLAY, minWords: 450 },
  about: { sections: ABOUT, minWords: 260 },
  privacy: { sections: PRIVACY, minWords: 330 },
  terms: { sections: TERMS, minWords: 280 },
  disclaimer: { sections: DISCLAIMER, minWords: 170 },
  contact: { sections: [...CONTACT, ...CONTACT_EXTRA], minWords: 150 },
};

describe("site content", () => {
  test("every page has enough original text and every section has a heading and a body", () => {
    const problems: string[] = [];
    for (const [name, { sections, minWords }] of Object.entries(PAGES)) {
      const total = words(textOf(sections).join(" "));
      if (total < minWords) problems.push(`${name}: ${total} words (< ${minWords})`);
      for (const s of sections) {
        if (s.heading.trim().length === 0) problems.push(`${name}: empty heading`);
        if ((s.paragraphs?.length ?? 0) + (s.items?.length ?? 0) === 0) {
          problems.push(`${name}: section "${s.heading}" has no text`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test("no paragraph is repeated anywhere and none is a throwaway line", () => {
    const all = [
      ...Object.values(PAGES).flatMap((p) => textOf(p.sections)),
      ...Object.values(WORLD_GUIDES).flatMap((g) => [
        g.intro,
        ...g.ideas.map((i) => i.text),
      ]),
    ];
    expect(new Set(all).size).toBe(all.length);
    expect(all.filter((t) => words(t) < 5)).toEqual([]);
  });

  test("there is a guide of real length for each of the five worlds, with no leftover placeholder text", () => {
    for (let world = 1; world <= 5; world++) {
      const guide = WORLD_GUIDES[world];
      expect(guide).toBeDefined();
      const total = words([guide?.intro ?? "", ...(guide?.ideas.map((i) => i.text) ?? [])].join(" "));
      expect(total).toBeGreaterThanOrEqual(110);
    }
    const everything = JSON.stringify([PAGES, WORLD_GUIDES]).toLowerCase();
    for (const bad of ["lorem", "todo", "tbd", "coming soon"]) {
      expect(everything.includes(bad)).toBe(false);
    }
  });
});