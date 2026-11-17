import {
  act,
  call,
  cond,
  ifElse,
  rep,
  sensor,
  setVar,
  vr,
  when,
  whileDo,
} from "@/engine/builders";
import { countAll } from "@/engine/editor";
import type { Roots } from "@/engine/editor";
import { DEFAULT_LIMITS, validateProgram } from "@/engine/interpreter";
import { validateLevel } from "@/engine/level";
import type { Instruction } from "@/engine/program";
import { simulate } from "@/engine/simulate";
import type { Direction, LevelDef, LevelObject, Vec } from "@/engine/types";
import {
  decorate,
  isSimple,
  layout,
  leg,
  placeFeatures,
  walkLegs,
} from "./pathing";
import type { Leg, Placement, Turn } from "./pathing";
import { pick, randInt } from "./rng";
import type { Rng } from "./rng";

export interface LevelEntry {
  level: LevelDef;
  /** Solusi referensi: dipakai untuk validasi, par, dan (nanti) hint. */
  solution: Roots;
  /** True jika generator gagal dan level cadangan dipakai. */
  fallback: boolean;
}

interface SolveCtx {
  legs: readonly Leg[];
  tiles: readonly Vec[];
  placement: Placement;
}

export interface Build {
  legs: readonly Leg[];
  startDir: Direction;
  mode: "open" | "ribbon";
  strict: boolean;
  stars: number;
  gate: boolean;
  requireAllStars: boolean;
  /** Penempatan tetap (untuk koridor). */
  fixed?: Placement;
  switchCandidates?: (tiles: readonly Vec[]) => readonly number[];
  decorDensity: number;
  solve: (ctx: SolveCtx) => Roots;
  allowedCommands: readonly string[];
  functions?: readonly string[];
  variables?: readonly string[];
  /** Tambahan batas blok di atas jumlah blok solusi. */
  slack: number;
  tutorial: string;
}

/* ---------- Perakitan level ---------- */

export function assemble(
  id: string,
  name: string,
  difficulty: number,
  build: Build,
  rng: Rng,
): LevelEntry | null {
  const tiles = walkLegs(build.legs, build.startDir);
  if (!isSimple(tiles, build.strict)) return null;
  const geo = layout(tiles, build.mode);
  if (!geo) return null;

  const placement =
    build.fixed ??
    placeFeatures(
      geo.tiles,
      rng,
      build.stars,
      build.gate,
      build.switchCandidates?.(geo.tiles),
    );
  if (!placement) return null;

  const solution = build.solve({ legs: build.legs, tiles: geo.tiles, placement });

  const objects: LevelObject[] = [];
  placement.starIdx.forEach((idx, n) => {
    const at = geo.tiles[idx];
    if (at) objects.push({ id: `star-${n + 1}`, kind: "star", at });
  });
  placement.pairs.forEach((pair, n) => {
    const sw = geo.tiles[pair.switchIdx];
    const gt = geo.tiles[pair.gateIdx];
    if (!sw || !gt) return;
    objects.push({ id: `switch-${n + 1}`, kind: "switch", at: sw, linkedTo: `gate-${n + 1}` });
    objects.push({ id: `gate-${n + 1}`, kind: "gate", at: gt });
  });
  objects.push(...decorate(geo.rows, rng, build.decorDensity));

  const start = geo.tiles[0];
  const goal = geo.tiles[geo.tiles.length - 1];
  if (!start || !goal) return null;

  const parCommands = countAll(solution);
  const maxInstructions = Math.min(
    DEFAULT_LIMITS.maxInstructions,
    parCommands + build.slack,
  );

  const level: LevelDef = {
    id,
    name,
    rows: geo.rows,
    start,
    startDir: build.startDir,
    goal,
    objects,
    requireAllStars: build.requireAllStars,
    parCommands,
    maxInstructions,
    difficulty,
    allowedCommands: build.allowedCommands,
    functions: build.functions,
    variables: build.variables,
    tutorial: build.tutorial,
  };

  if (validateLevel(level).length > 0) return null;
  if (validateProgram(solution.program, maxInstructions, solution.functions).length > 0) {
    return null;
  }
  const sim = simulate(level, solution);
  if (!sim.complete) return null;

  return { level: { ...level, parSteps: sim.steps }, solution, fallback: false };
}

/* ---------- Utilitas pembuat solusi ---------- */

function counter(): () => number {
  let n = 0;
  return () => {
    n += 1;
    return n;
  };
}

function randomDir(rng: Rng): Direction {
  return randInt(rng, 0, 3) as Direction;
}

function pushTurn(list: Instruction[], ids: () => number, turn: Turn): void {
  if (turn === 1) list.push(act(ids(), "right"));
  else if (turn === -1) list.push(act(ids(), "left"));
}

/** Solusi datar: urutan aksi persis mengikuti jalur. */
function flatSolve(ctx: SolveCtx): Roots {
  const ids = counter();
  const stars = new Set(ctx.placement.starIdx);
  const switches = new Set(ctx.placement.pairs.map((p) => p.switchIdx));
  const program: Instruction[] = [];
  let idx = 0;

  ctx.legs.forEach((l, li) => {
    for (let k = 0; k < l.len; k++) {
      program.push(act(ids(), "forward"));
      idx += 1;
      if (stars.has(idx)) program.push(act(ids(), "collect"));
      if (switches.has(idx)) program.push(act(ids(), "interact"));
    }
    if (li < ctx.legs.length - 1) pushTurn(program, ids, l.turn);
  });
  return { program, functions: [] };
}

/** Solusi dengan loop: satu pola (unit) diulang. */
function loopsSolve(unit: readonly Leg[], reps: number): () => Roots {
  return () => {
    const ids = counter();
    const body: Instruction[] = [];
    for (const l of unit) {
      body.push(
        l.len === 1 ? act(ids(), "forward") : rep(ids(), l.len, [act(ids(), "forward")]),
      );
      pushTurn(body, ids, l.turn);
    }
    return { program: reps === 1 ? body : [rep(ids(), reps, body)], functions: [] };
  };
}

type FollowMode = "R" | "L" | "RL";

function movement(ids: () => number, mode: FollowMode): Instruction {
  const forward = [act(ids(), "forward")];
  if (mode === "R") {
    return ifElse(ids(), when(sensor("pathAhead")), forward, [act(ids(), "right")]);
  }
  if (mode === "L") {
    return ifElse(ids(), when(sensor("pathAhead")), forward, [act(ids(), "left")]);
  }
  return ifElse(ids(), when(sensor("pathAhead")), forward, [
    ifElse(ids(), when(sensor("pathRight")), [act(ids(), "right")], [act(ids(), "left")]),
  ]);
}

/** Solusi dengan sensor: mengikuti jalur dengan If / Else di dalam loop. */
function followSolve(
  mode: FollowMode,
  stars: number,
  gate: boolean,
  useWhile: boolean,
): (ctx: SolveCtx) => Roots {
  return (ctx) => {
    const ids = counter();
    const body: Instruction[] = [];
    if (stars > 0) {
      body.push(ifElse(ids(), when(sensor("starHere")), [act(ids(), "collect")]));
    }
    if (gate) {
      body.push(ifElse(ids(), when(sensor("switchHere")), [act(ids(), "interact")]));
    }
    body.push(movement(ids, mode));

    if (useWhile) {
      return {
        program: [whileDo(ids(), when(sensor("atGoal", true)), body)],
        functions: [],
      };
    }
    const iterations = ctx.tiles.length - 1 + ctx.legs.length - 1;
    return { program: [rep(ids(), iterations, body)], functions: [] };
  };
}

function equalFnSolve(legs: readonly Leg[], len: number): () => Roots {
  return () => {
    const ids = counter();
    const main: Instruction[] = [];
    legs.forEach((l, i) => {
      main.push(call(ids(), "f1"));
      if (i < legs.length - 1) pushTurn(main, ids, l.turn);
    });
    return {
      program: main,
      functions: [
        { id: "f1", params: [], body: [rep(ids(), len, [act(ids(), "forward")])] },
      ],
    };
  };
}

function paramFnSolve(legs: readonly Leg[], interactLeg: number | undefined): () => Roots {
  return () => {
    const ids = counter();
    const main: Instruction[] = [];
    legs.forEach((l, i) => {
      main.push(call(ids(), "f1", [l.len]));
      if (i === interactLeg) main.push(act(ids(), "interact"));
      if (i < legs.length - 1) pushTurn(main, ids, l.turn);
    });
    return {
      program: main,
      functions: [
        {
          id: "f1",
          params: ["n"],
          body: [rep(ids(), vr("n"), [act(ids(), "forward")])],
        },
      ],
    };
  };
}

function multiFnSolve(legs: readonly Leg[]): () => Roots {
  return () => {
    const ids = counter();
    const main: Instruction[] = [];
    legs.forEach((l, i) => {
      if (i === 0) {
        main.push(call(ids(), "f1", [l.len]));
      } else {
        const before = legs[i - 1];
        main.push(call(ids(), before && before.turn === -1 ? "f3" : "f2", [l.len]));
      }
    });
    return {
      program: main,
      functions: [
        {
          id: "f1",
          params: ["n"],
          body: [rep(ids(), vr("n"), [act(ids(), "forward")])],
        },
        {
          id: "f2",
          params: ["n"],
          body: [act(ids(), "right"), call(ids(), "f1", [vr("n")])],
        },
        {
          id: "f3",
          params: ["n"],
          body: [act(ids(), "left"), call(ids(), "f1", [vr("n")])],
        },
      ],
    };
  };
}

/* ---------- World 1: gerak dan arah ---------- */

const L = leg;

const W1_LEGS: readonly (readonly Leg[])[] = [
  [L(3)],
  [L(5)],
  [L(2, 1), L(3)],
  [L(3, -1), L(2)],
  [L(2, 1), L(2, -1), L(2)],
  [L(3, 1), L(2, 1), L(3)],
  [L(2, -1), L(3, 1), L(2)],
  [L(3, 1), L(3, -1), L(3, 1), L(2)],
  [L(4, 1), L(2, 1), L(4, -1), L(2)],
  [L(2, 1), L(2, -1), L(2, 1), L(2, -1), L(2)],
  [L(4, -1), L(2, -1), L(2, 1), L(3, 1), L(2)],
  [L(3, 1), L(4, 1), L(3, -1), L(2, -1), L(3)],
  [L(5, 1), L(3, 1), L(2, -1), L(3, 1), L(4)],
  [L(3, -1), L(3, 1), L(2, 1), L(3, -1), L(2, 1), L(2)],
  [L(4, 1), L(3, -1), L(2, -1), L(2, 1), L(3)],
];

const W1_STARS = [0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 0, 0, 0, 2, 3];

function tutorialW1(i: number, stars: number, gate: boolean, all: boolean): string {
  if (i === 1) {
    return "Move Forward walks one tile. Tap it (or drag it into the program) three times, then press Execute.";
  }
  if (i === 2) return "A longer path: just add more Move Forward blocks.";
  if (gate && stars > 0) {
    return "Open the gate with Interact while you stand on the switch, and collect the stars on the way.";
  }
  if (gate) {
    return "A purple gate blocks the way. Stand on the switch and use Interact to open it.";
  }
  if (all) {
    return "Collect every star before you reach the flag. This level requires it.";
  }
  if (stars > 0) {
    return "Stand on a star and use Collect to pick it up. Stars are a bonus objective.";
  }
  return "Turn Left and Turn Right rotate the robot. The yellow arrow shows where it is looking.";
}

export function buildWorld1(index: number, rng: Rng): Build | null {
  const legs = W1_LEGS[index - 1];
  if (!legs) return null;
  const stars = W1_STARS[index - 1] ?? 0;
  const gate = index >= 11;
  const all = index === 8 || index === 15;
  const allowed = ["move"];
  if (index >= 3) allowed.push("left", "right");
  if (index >= 6) allowed.push("collect");
  if (index >= 11) allowed.push("interact");

  return {
    legs,
    startDir: randomDir(rng),
    mode: gate ? "ribbon" : "open",
    strict: false,
    stars,
    gate,
    requireAllStars: all,
    decorDensity: 0.12,
    solve: flatSolve,
    allowedCommands: allowed,
    slack: 6,
    tutorial: tutorialW1(index, stars, gate, all),
  };
}

/* ---------- World 2: loop dan nested loop ---------- */

interface LoopSpec {
  unit: readonly Leg[];
  reps: number;
}

const W2_SPECS: readonly LoopSpec[] = [
  { unit: [L(6)], reps: 1 },
  { unit: [L(9)], reps: 1 },
  { unit: [L(3, 1)], reps: 3 },
  { unit: [L(4, 1)], reps: 3 },
  { unit: [L(1, -1), L(1, 1)], reps: 4 },
  { unit: [L(2, -1), L(1, 1)], reps: 3 },
  { unit: [L(2, -1), L(2, 1)], reps: 3 },
  { unit: [L(3, 1), L(1, 1), L(3, -1), L(1, -1)], reps: 2 },
  { unit: [L(4, 1), L(1, 1), L(4, -1), L(1, -1)], reps: 2 },
  { unit: [L(3, 1), L(2, -1)], reps: 2 },
  { unit: [L(4, 1), L(2, 1), L(4, -1), L(2, -1)], reps: 2 },
  { unit: [L(1, 1), L(3, -1)], reps: 3 },
  { unit: [L(5, 1)], reps: 3 },
  { unit: [L(5, 1), L(1, 1), L(5, -1), L(1, -1)], reps: 2 },
  { unit: [L(2, 1), L(2, -1), L(1, 1), L(1, -1)], reps: 2 },
];

export function buildWorld2(index: number, rng: Rng): Build | null {
  const spec = W2_SPECS[index - 1];
  if (!spec) return null;
  const legs = Array.from({ length: spec.reps }, () => spec.unit).flat();

  return {
    legs,
    startDir: randomDir(rng),
    mode: "open",
    strict: false,
    stars: 0,
    gate: false,
    requireAllStars: false,
    decorDensity: 0.12,
    solve: loopsSolve(spec.unit, spec.reps),
    allowedCommands: index <= 2 ? ["move", "repeat"] : ["move", "left", "right", "repeat"],
    slack: 1,
    tutorial:
      index <= 2
        ? "Repeat runs the blocks inside it several times. Drag Repeat into your program, pick a number, then put Move Forward inside."
        : "Find the pattern that repeats and put it inside one Repeat. A Repeat can also hold another Repeat.",
  };
}

/* ---------- World 3 dan 5: sensor dan mengikuti jalur ---------- */

interface FollowSpec {
  legs: number;
  turns: readonly [Turn, ...Turn[]];
  stars: number;
  gate: boolean;
  requireAll: boolean;
  minLen: number;
}

const MIXED: readonly [Turn, ...Turn[]] = [-1, 1];

const W3_SPECS: readonly FollowSpec[] = [
  { legs: 2, turns: [1], stars: 0, gate: false, requireAll: false, minLen: 3 },
  { legs: 3, turns: [-1], stars: 0, gate: false, requireAll: false, minLen: 3 },
  { legs: 4, turns: [1], stars: 0, gate: false, requireAll: false, minLen: 2 },
  { legs: 3, turns: MIXED, stars: 0, gate: false, requireAll: false, minLen: 3 },
  { legs: 4, turns: MIXED, stars: 0, gate: false, requireAll: false, minLen: 2 },
  { legs: 5, turns: MIXED, stars: 0, gate: false, requireAll: false, minLen: 2 },
  { legs: 3, turns: MIXED, stars: 2, gate: false, requireAll: false, minLen: 2 },
  { legs: 4, turns: MIXED, stars: 3, gate: false, requireAll: false, minLen: 2 },
  { legs: 5, turns: MIXED, stars: 3, gate: false, requireAll: true, minLen: 2 },
  { legs: 4, turns: MIXED, stars: 0, gate: true, requireAll: false, minLen: 2 },
  { legs: 5, turns: MIXED, stars: 2, gate: true, requireAll: false, minLen: 2 },
  { legs: 6, turns: MIXED, stars: 0, gate: false, requireAll: false, minLen: 2 },
  { legs: 6, turns: MIXED, stars: 2, gate: true, requireAll: false, minLen: 2 },
  { legs: 7, turns: MIXED, stars: 0, gate: false, requireAll: false, minLen: 2 },
  { legs: 7, turns: MIXED, stars: 3, gate: true, requireAll: true, minLen: 2 },
];

const W5_FOLLOW: readonly FollowSpec[] = [
  { legs: 4, turns: MIXED, stars: 2, gate: false, requireAll: false, minLen: 2 },
  { legs: 5, turns: MIXED, stars: 0, gate: true, requireAll: false, minLen: 2 },
  { legs: 6, turns: MIXED, stars: 2, gate: true, requireAll: true, minLen: 2 },
];

function randomFollowLegs(
  rng: Rng,
  spec: FollowSpec,
  startDir: Direction,
): Leg[] | null {
  for (let tries = 0; tries < 400; tries++) {
    const legs: Leg[] = [];
    for (let i = 0; i < spec.legs; i++) {
      const turn: Turn = i === spec.legs - 1 ? 0 : pick(rng, spec.turns);
      legs.push(leg(randInt(rng, spec.minLen, 4), turn));
    }
    const tiles = walkLegs(legs, startDir);
    if (isSimple(tiles, true) && layout(tiles, "ribbon")) return legs;
  }
  return null;
}

function followBuild(
  spec: FollowSpec,
  rng: Rng,
  useWhile: boolean,
  tutorial: string,
): Build | null {
  const startDir = randomDir(rng);
  const legs = randomFollowLegs(rng, spec, startDir);
  if (!legs) return null;

  const turnMode: FollowMode =
    spec.turns.length === 1 ? (spec.turns[0] === 1 ? "R" : "L") : "RL";
  const allowed = ["move", "left", "right", useWhile ? "while" : "repeat", "if"];
  if (spec.stars > 0) allowed.push("collect");
  if (spec.gate) allowed.push("interact");

  return {
    legs,
    startDir,
    mode: "ribbon",
    strict: true,
    stars: spec.stars,
    gate: spec.gate,
    requireAllStars: spec.requireAll,
    decorDensity: 0.1,
    solve: followSolve(turnMode, spec.stars, spec.gate, useWhile),
    allowedCommands: allowed,
    slack: 1,
    tutorial,
  };
}

function tutorialW3(index: number, spec: FollowSpec): string {
  if (index === 1) {
    return "If checks a sensor. If there is a path ahead, move forward. Otherwise turn right. Put the If inside a Repeat.";
  }
  if (spec.gate) {
    return "Use If with 'switch here', then Interact, before you move so the gate opens in time. Keep following the path.";
  }
  if (spec.stars > 0) {
    return "Add an If with 'star here' that uses Collect, then keep following the path.";
  }
  if (spec.turns.length === 1) {
    return "Same idea: if there is a path ahead move forward, otherwise turn. This path always turns the same way.";
  }
  return "This path turns both ways. Put an If inside the Else: if there is a path to the right turn right, otherwise turn left.";
}

export function buildWorld3(index: number, rng: Rng): Build | null {
  const spec = W3_SPECS[index - 1];
  if (!spec) return null;
  return followBuild(spec, rng, false, tutorialW3(index, spec));
}

/* ---------- World 4: fungsi dan parameter ---------- */

interface FnSpec {
  kind: "equal" | "param" | "multi";
  lens: readonly number[];
  turns: readonly Turn[];
  gateLeg?: number;
}

const W4_SPECS: readonly FnSpec[] = [
  { kind: "equal", lens: [3, 3, 3], turns: [1, -1] },
  { kind: "equal", lens: [3, 3, 3, 3], turns: [1, 1, -1] },
  { kind: "equal", lens: [4, 4, 4, 4], turns: [-1, 1, 1] },
  { kind: "equal", lens: [2, 2, 2, 2, 2], turns: [1, -1, 1, -1] },
  { kind: "equal", lens: [3, 3, 3, 3, 3], turns: [1, -1, -1, 1] },
  { kind: "equal", lens: [2, 2, 2, 2, 2, 2], turns: [1, 1, -1, -1, 1] },
  { kind: "param", lens: [2, 3, 4], turns: [1, -1] },
  { kind: "param", lens: [3, 2, 4, 2], turns: [1, 1, -1] },
  { kind: "param", lens: [4, 2, 3, 3], turns: [-1, 1, -1] },
  { kind: "param", lens: [2, 3, 2, 3, 2], turns: [1, -1, 1, -1] },
  { kind: "param", lens: [3, 2, 3], turns: [-1, 1], gateLeg: 0 },
  { kind: "param", lens: [2, 4, 2, 3], turns: [1, 1, -1], gateLeg: 1 },
  { kind: "param", lens: [2, 3, 2, 2, 2], turns: [1, -1, 1, -1], gateLeg: 1 },
  { kind: "multi", lens: [2, 2, 3, 2, 2], turns: [1, -1, 1, -1] },
  { kind: "multi", lens: [2, 3, 2, 3, 2, 2], turns: [1, 1, -1, -1, 1] },
];

function tutorialW4(spec: FnSpec): string {
  if (spec.kind === "equal") {
    return "Functions are reusable blocks. Put the repeated walk into Function A, then call it for every segment.";
  }
  if (spec.kind === "multi") {
    return "Functions can call other functions. Make one that walks, then one that turns and walks for each direction.";
  }
  if (spec.gateLeg !== undefined) {
    return "Call Function A for each segment, and use Interact when you stand on the switch to open the gate.";
  }
  return "Add a value (n) to Function A and repeat n times. Then call it with a different number for each segment.";
}

export function buildWorld4(index: number, rng: Rng): Build | null {
  const spec = W4_SPECS[index - 1];
  if (!spec) return null;
  const legs = spec.lens.map((len, i) =>
    leg(len, i < spec.lens.length - 1 ? (spec.turns[i] ?? 0) : 0),
  );
  const gateLeg = spec.gateLeg;
  const gate = gateLeg !== undefined;
  const allowed = ["move", "left", "right", "repeat", "call"];
  if (gate) allowed.push("interact");

  const solve =
    spec.kind === "equal"
      ? equalFnSolve(legs, spec.lens[0] ?? 3)
      : spec.kind === "param"
        ? paramFnSolve(legs, gateLeg)
        : multiFnSolve(legs);

  return {
    legs,
    startDir: randomDir(rng),
    mode: gate ? "ribbon" : "open",
    strict: false,
    stars: 0,
    gate,
    requireAllStars: false,
    switchCandidates:
      gateLeg !== undefined
        ? () => [spec.lens.slice(0, gateLeg + 1).reduce((a, b) => a + b, 0)]
        : undefined,
    decorDensity: 0.12,
    solve,
    allowedCommands: allowed,
    functions: spec.kind === "multi" ? ["f1", "f2", "f3"] : ["f1"],
    slack: 1,
    tutorial: tutorialW4(spec),
  };
}

/* ---------- World 5: variabel, while, dan logika lanjut ---------- */

interface SpiralSpec {
  s0: number;
  d: number;
  k: number;
}

const SPIRALS: readonly SpiralSpec[] = [
  { s0: 2, d: 1, k: 3 },
  { s0: 1, d: 2, k: 4 },
  { s0: 2, d: 1, k: 4 },
  { s0: 1, d: 1, k: 5 },
  { s0: 5, d: -1, k: 4 },
  { s0: 6, d: -2, k: 3 },
];

const SPIRALS_FN: readonly SpiralSpec[] = [
  { s0: 1, d: 1, k: 4 },
  { s0: 2, d: 2, k: 3 },
  { s0: 4, d: -1, k: 4 },
];

function spiralBuild(spec: SpiralSpec, withFn: boolean, rng: Rng): Build {
  const legs = Array.from({ length: spec.k }, (_, i) =>
    leg(spec.s0 + i * spec.d, i < spec.k - 1 ? 1 : 0),
  );
  const op = spec.d >= 0 ? "add" : "sub";
  const step = Math.abs(spec.d);

  const solve = withFn
    ? (): Roots => {
        const ids = counter();
        return {
          program: [
            setVar(ids(), "size", "set", spec.s0),
            rep(ids(), spec.k, [call(ids(), "f1", [vr("size")]), setVar(ids(), "size", op, step)]),
          ],
          functions: [
            {
              id: "f1",
              params: ["n"],
              body: [rep(ids(), vr("n"), [act(ids(), "forward")]), act(ids(), "right")],
            },
          ],
        };
      }
    : (): Roots => {
        const ids = counter();
        return {
          program: [
            setVar(ids(), "size", "set", spec.s0),
            rep(ids(), spec.k, [
              rep(ids(), vr("size"), [act(ids(), "forward")]),
              act(ids(), "right"),
              setVar(ids(), "size", op, step),
            ]),
          ],
          functions: [],
        };
      };

  return {
    legs,
    startDir: randomDir(rng),
    mode: "open",
    strict: false,
    stars: 0,
    gate: false,
    requireAllStars: false,
    decorDensity: 0.1,
    solve,
    allowedCommands: withFn
      ? ["move", "right", "repeat", "set", "call"]
      : ["move", "right", "repeat", "set"],
    functions: withFn ? ["f1"] : undefined,
    variables: ["size"],
    slack: 1,
    tutorial: withFn
      ? "Send a variable to a function: call Function A with size, then change size after every call."
      : "A variable remembers a number. Change it after every turn so each side gets longer or shorter.",
  };
}

function corridorBuild(pairsCount: number, rng: Rng): Build {
  const n = pairsCount === 1 ? 9 : 3 * pairsCount + 2;
  const pairs = Array.from({ length: pairsCount }, (_, j) => ({
    switchIdx: 1 + 3 * j,
    gateIdx: 3 + 3 * j,
  }));

  return {
    legs: [leg(n)],
    startDir: randomDir(rng),
    mode: "ribbon",
    strict: false,
    stars: 0,
    gate: false,
    requireAllStars: false,
    fixed: { starIdx: [], pairs },
    decorDensity: 0,
    solve: () => {
      const ids = counter();
      return {
        program: [
          rep(ids(), pairsCount, [
            whileDo(
              ids(),
              cond("and", sensor("pathAhead"), sensor("switchHere", true)),
              [act(ids(), "forward")],
            ),
            act(ids(), "interact"),
            act(ids(), "forward"),
          ]),
          whileDo(ids(), when(sensor("pathAhead")), [act(ids(), "forward")]),
        ],
        functions: [],
      };
    },
    allowedCommands: ["move", "interact", "repeat", "while"],
    slack: 1,
    tutorial:
      "While repeats as long as its condition is true. Combine conditions with and / not: walk until you stand on the switch, press Interact, step off, and repeat.",
  };
}

export function buildWorld5(index: number, rng: Rng): Build | null {
  if (index <= 6) {
    const spec = SPIRALS[index - 1];
    return spec ? spiralBuild(spec, false, rng) : null;
  }
  if (index <= 9) return corridorBuild(index - 6, rng);
  if (index <= 12) {
    const spec = W5_FOLLOW[index - 10];
    return spec
      ? followBuild(
          spec,
          rng,
          true,
          "Use While with 'not at goal'. Inside, check for stars and switches, then follow the path with If / Else.",
        )
      : null;
  }
  const spec = SPIRALS_FN[index - 13];
  return spec ? spiralBuild(spec, true, rng) : null;
}