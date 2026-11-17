import { describe, expect, test } from "bun:test";
import { buildCatalog } from "@/data/levels/catalog";
import { act, rep } from "./builders";
import { MAX_HINT_LEVEL, buildHint } from "./hints";
import type { Roots } from "./editor";

const solution: Roots = {
  program: [rep(1, 3, [act(2, "forward")]), act(3, "right")],
  functions: [],
};

describe("hints", () => {
  test("hint 1 gives the block count and the kinds of blocks", () => {
    const hint = buildHint(solution, 1);
    expect(hint).toContain("3 blocks");
    expect(hint).toContain("Repeat");
    expect(hint).toContain("Move Forward");
    expect(hint).toContain("Turn Right");
  });

  test("hint 2 shows only the first step and hint 3 shows everything", () => {
    const second = buildHint(solution, 2);
    expect(second).toContain("Repeat 3 times:");
    expect(second).toContain("Move Forward");
    expect(second).not.toContain("Turn Right");

    const third = buildHint(solution, 3);
    expect(third).toContain("Repeat 3 times:");
    expect(third).toContain("Turn Right");
  });

  test("every level of the catalog has three non-empty hints", () => {
    const problems: string[] = [];
    for (const { level, solution: reference } of buildCatalog()) {
      for (let n = 1; n <= MAX_HINT_LEVEL; n++) {
        if (buildHint(reference, n).trim().length === 0) problems.push(`${level.id}: hint ${n}`);
      }
    }
    expect(problems).toEqual([]);
  });
});