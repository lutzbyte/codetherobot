export interface WorldGuide {
  intro: string;
  ideas: readonly { term: string; text: string }[];
}

/** Panduan konsep per world, ditampilkan di halaman daftar level. */
export const WORLD_GUIDES: Record<number, WorldGuide> = {
  1: {
    intro:
      "This world is about order. A program is a list that the robot follows from top to bottom, one block at a time, and it never guesses what you meant. The only skills you need are counting tiles and knowing which way the robot is facing.",
    ideas: [
      {
        term: "Facing matters",
        text: "Move Forward always goes in the direction the yellow arrow points. Turn Left and Turn Right rotate the robot a quarter turn without moving it, so a corner usually needs a turn followed by moves.",
      },
      {
        term: "Plan before you tap",
        text: "Trace the route on the board with your finger and count each straight stretch. Then write the program one stretch at a time: moves, turn, moves.",
      },
      {
        term: "Extras",
        text: "From level 6 some stars lie on the route; stand on one and use Collect. From level 11 a purple gate blocks the way until you stand on its switch and use Interact. Levels 8 and 15 will not finish until every star has been collected.",
      },
      {
        term: "Debugging",
        text: "If the robot ends up in the wrong place, press Reset, then Step through the program and stop at the first block whose result surprises you.",
      },
    ],
  },
  2: {
    intro:
      "Typing the same block six times works until a level gives you room for only three. This world shows why loops exist: a Repeat block runs the blocks inside it a fixed number of times, so the length of your program stops depending on the length of the path.",
    ideas: [
      {
        term: "Find the smallest repeating unit",
        text: "Look at the route and ask what keeps happening. A staircase is forward, turn left, forward, turn right, again and again. Put that unit inside one Repeat and count how many times it happens.",
      },
      {
        term: "Nested loops",
        text: "A Repeat can sit inside another Repeat. The long side of a square-like walk is an inner loop that moves several tiles, and the outer loop repeats that side together with a turn.",
      },
      {
        term: "The block counter",
        text: "The counter counts every block, including those inside a Repeat, so a Repeat with one Move inside costs two blocks however large its number is.",
      },
      {
        term: "Off by one",
        text: "If the robot stops a tile early, change the Repeat number by one before you change anything else.",
      },
    ],
  },
  3: {
    intro:
      "From here the robot can look before it moves. Sensors answer yes-or-no questions about the tile ahead, to the left or right, or the tile it stands on, and an If block runs its contents only when the answer is yes.",
    ideas: [
      {
        term: "The sensors",
        text: "Path ahead, path left, path right, blocked ahead, gate ahead, star here, switch here and at goal. Any of them can be reversed with the not button.",
      },
      {
        term: "Else",
        text: "An Else branch runs when the condition is false. An Else can hold another If, which is how a robot chooses between turning right and turning left.",
      },
      {
        term: "A path follower",
        text: "Put one If inside a Repeat: if there is a path ahead, move forward; otherwise turn. The same few blocks then solve paths of any length, because the robot decides at each tile instead of following a script you wrote.",
      },
      {
        term: "Order matters",
        text: "On levels with a switch, check switch here and use Interact before the movement If, so the gate is already open when the robot reaches it.",
      },
    ],
  },
  4: {
    intro:
      "A function is a named group of blocks that you write once and call as often as you like. Function A in the editor starts empty; whatever you put in it runs every time a Function block calls it.",
    ideas: [
      {
        term: "Reuse",
        text: "When the same walk appears several times along the route, move it into a function. The block limit counts the function's blocks only once, however many times you call it.",
      },
      {
        term: "Parameters",
        text: "Press + value on a function to give it a number named n; a second value is called m. Inside the function you can use n as a Repeat count, and each call chooses its own number, so one function can walk segments of different lengths.",
      },
      {
        term: "Functions calling functions",
        text: "A function may call another one. Levels 14 and 15 are built for this: a walk function, a turn-right-and-walk function and a turn-left-and-walk function.",
      },
      {
        term: "Debugging",
        text: "Test a function on its own by calling it once from the main program, check the result, and only then add the rest.",
      },
    ],
  },
  5: {
    intro:
      "The last world combines everything and adds memory. A variable holds a number that you can change while the program runs, and While repeats for as long as a condition stays true instead of a fixed number of times.",
    ideas: [
      {
        term: "Variables",
        text: "Set size to 1, add one to it after every turn, and use size as the Repeat count. The same blocks now trace a spiral whose sides grow, or shrink if you subtract.",
      },
      {
        term: "While and conditions",
        text: "A While block can combine conditions with and, or and not: walk while there is a path ahead and you are not standing on the switch.",
      },
      {
        term: "Safety limits",
        text: "A program that never ends is stopped for you: after 500 robot actions, after 5,000 evaluated blocks, or when functions call each other more than 24 levels deep. The message tells you which limit was hit.",
      },
      {
        term: "Optimising",
        text: "Block limits are tight here. After you have a working solution, ask which blocks do the same job twice and whether a variable or a function could replace them.",
      },
    ],
  },
};