import { CONTACT_EMAIL, GAME_VERSION, OPERATOR_NAME } from "@/site/siteInfo";

export interface Section {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
}

export const HOW_TO_PLAY: readonly Section[] = [
  {
    heading: "What you are trying to do",
    paragraphs: [
      "Every level is a small island seen from above. Your robot stands on one tile and a red flag marks another. Your job is to write a short program that walks the robot from the first tile to the flag. The yellow triangle under the robot shows which way it is facing, and that direction matters more than anything else in the game: Move Forward always means one tile in front of the robot, never one tile up the screen.",
      "Some islands add extras. Stars can be collected for a bonus, a purple gate can block the only path until you press the matching purple switch, and a few levels will not finish until every star has been picked up.",
    ],
  },
  {
    heading: "Building a program",
    paragraphs: [
      "Tap a command to add it to the end of your program, or press and drag it to the exact spot you want. Blocks that hold other blocks, such as Repeat, If and While, have a dashed area inside them where the nested commands go. To change the order, drag the dotted handle on the left of a block, or focus the handle and use the arrow keys.",
    ],
    items: [
      "The counter next to Program, for example 4 / 8, is a hard limit on the number of blocks, including blocks inside functions. Some levels are designed so that you cannot reach the flag unless you find a loop or a function.",
      "Undo and Redo sit above the program (Ctrl+Z and Ctrl+Y on a keyboard). The cross clears everything.",
      "The editor locks while a program is running. Press Reset to unlock it; your program is kept.",
    ],
  },
  {
    heading: "Running and debugging",
    paragraphs: [
      "Execute runs the whole program at walking speed, and the same button turns into Pause and then Resume. Step runs exactly one command each time you press it, which is the best tool for finding out why a program does something unexpected. The block that is running has a yellow outline. If the robot bumps into something, the block that caused it turns orange and a message explains what was in the way.",
    ],
    items: [
      "Walked off the island? Check which way the robot was facing before the move, not which way it looks like it should go.",
      "Stopped one tile short? Count the tiles again, then compare with the number in your Repeat.",
      "Program finished but the flag was not reached? Nothing is wrong with the game: the program simply ended early. Add the missing moves.",
      "A message about the step limit or a program that ran too long usually means a While loop whose condition never becomes false.",
    ],
  },
  {
    heading: "Reading the board",
    items: [
      "Trees, stones and crates cannot be entered.",
      "The open blue around the island is the edge of the world. The robot cannot leave it.",
      "A closed purple gate blocks movement. Stand on the matching purple switch and use Interact to open it. Using Interact on the switch again closes the gate.",
      "Collect picks up a star only when the robot stands on the same tile. On any other tile it does nothing, and it does not cause an error.",
      "Wait pauses the robot for one beat.",
    ],
  },
  {
    heading: "Stars, coins and XP",
    paragraphs: [
      "Each level has three objectives: reach the flag; use no more blocks than the number shown on the results screen, which is called the par; and a bonus, which is collecting every star on the map or, on levels without stars, finishing in the par number of moves. Your stars for a level equal the objectives you complete, so reaching the flag is always worth one.",
      "The first time you clear a level you earn 10 coins plus 10 for each star, and 30 XP plus 10 per star. Replaying only pays out for stars you did not have before. Your coin balance is the gold pill in the top bar; on a phone it sits in the header between the logo and the menu. Tapping it opens the Robot Collection, where coins buy colours, accessories and trails. XP raises your player level: level 2 at 100 XP, level 3 at 300 XP, and so on.",
    ],
  },
  {
    heading: "Worlds and unlocking",
    paragraphs: [
      "There are five worlds of fifteen levels each. Inside a world, a level opens after you finish the one before it. The next world opens once you have finished ten levels of the current one. In order, the worlds teach sequences and turning, repeating, decisions with sensors, functions with parameters, and variables with While loops. Every world page carries a short guide to its ideas.",
    ],
  },
  {
    heading: "Daily puzzle and challenge modes",
    paragraphs: [
      "The Daily Challenge is generated from today's date, so everyone who plays on the same day gets the same puzzle. Finish it on five different days within one calendar week, Monday to Sunday, to claim the weekly reward. Three more modes live on the same page:",
    ],
    items: [
      "Endless Puzzle: puzzles get harder every round and you have three lives. A life is lost when a run ends without reaching the flag.",
      "Time Challenge: one puzzle and 150 seconds. The clock stops while a menu or dialog is open.",
      "Minimum Commands: the block limit equals the best known solution, so every block counts.",
    ],
  },
  {
    heading: "Hints and advertising",
    paragraphs: [
      "The Hint button offers three levels of help, each unlocked by watching one short optional ad when ads are enabled: first the number and kinds of blocks the best solution uses, then its first step, then the whole solution. Nothing in the game requires watching an ad. Ads can also appear at natural breaks such as moving on to the next level, and banner ads can appear at the bottom of world pages and, on narrow screens, below the editor on the play screen. The privacy policy explains what advertising partners may collect.",
    ],
  },
  {
    heading: "Keyboard, sound and motion",
    paragraphs: [
      "Every control can be reached with the Tab key. Sound, music and animations can each be switched off in Settings, and the game follows your device's reduced-motion setting. The language setting switches the menus between English and Bahasa Indonesia.",
    ],
  },
];

export const ABOUT: readonly Section[] = [
  {
    heading: "What Code the Robot is",
    paragraphs: [
      "Code the Robot is a puzzle game about giving instructions precisely. You do not type code; you assemble blocks that behave like the building blocks of real programming: sequences, loops, conditions, functions and variables. Each idea gets its own world, so you meet it in a situation where it is clearly useful rather than as a definition.",
      "It is aimed at beginners, students and anyone who enjoys puzzles. It is not a replacement for learning a real language such as Python or JavaScript, and it does not claim to be. What it practises is the habit underneath all of them: breaking a problem into steps, predicting what each step does, and fixing the step that went wrong.",
    ],
  },
  {
    heading: "How the levels are made",
    paragraphs: [
      "The 75 campaign levels are produced by rules written for each world, not copied from a template. Every generated level comes with a reference solution, and the game only accepts a level after running that solution through the same interpreter you use and confirming that the robot reaches the flag. The block limit of a level is set just above what the reference solution needs, which is why loops and functions stop being optional in the later worlds. The daily, endless, time and minimum puzzles use the same generators with different seeds.",
    ],
  },
  {
    heading: "Design principles",
    items: [
      "No accounts and no sign-in. Progress is stored in your browser.",
      "The campaign has no timers and no lives. Time pressure exists only in the optional Time Challenge.",
      "A failed run costs nothing: reset and try again.",
      "Sound is generated in your browser, and both sound and animation can be switched off.",
    ],
  },
  {
    heading: "Built with",
    paragraphs: [
      "React draws the menus, Phaser draws the island, and TypeScript holds it together. The robot, tiles and icons are drawn in code, and the music and sound effects are synthesised with the Web Audio API, so the game ships without borrowed artwork or recordings.",
    ],
  },
  {
    heading: "Version and contact",
    paragraphs: [
      `This is version ${GAME_VERSION}. Questions, corrections and bug reports are welcome on the Contact page.`,
    ],
  },
];

export const PRIVACY: readonly Section[] = [
  {
    heading: "The short version",
    paragraphs: [
      "Code the Robot does not ask you to create an account, and its own code does not send your game progress to a server. Your levels, stars, coins, settings and robot choices stay in your browser. The one place data can leave your device is advertising, described below.",
    ],
  },
  {
    heading: "What is stored on your device",
    items: [
      "Progress: completed levels, stars, best block counts, XP, coins, achievements, daily and weekly records, challenge records, and the cosmetics you own and wear.",
      "Settings: sound, music, animations, language, and the testing option that unlocks every level.",
      "Where: your browser's local storage and IndexedDB for this site. Nothing in it identifies you personally.",
    ],
    paragraphs: [
      "You can erase all of it in Settings, under Reset progress. Clearing the site's data in your browser does the same.",
    ],
  },
  {
    heading: "Advertising",
    paragraphs: [
      "The game may show ads from Google AdSense, including interstitial and rewarded ads in the H5 Games format and banner ads. Google and its partners can use cookies, device identifiers and similar technologies to serve and measure ads and, depending on where you are and the choices you make, to personalise them. We do not receive that information and cannot control it. To learn more or change your choices, see Google's ad settings at adssettings.google.com and Google's explanation at policies.google.com/technologies/partner-sites.",
      "A rewarded ad is always optional and is explained before it starts. We give the reward only after the ad has finished.",
      "Where the law requires your consent for personalised advertising, a consent message supplied through Google's tools may appear, and your answer applies to the ads shown.",
    ],
  },
  {
    heading: "Hosting and logs",
    paragraphs: [
      "Whoever hosts this site may keep ordinary server logs such as IP address, browser type and time of request. Those logs are handled by the hosting provider under its own policy and are not part of the game.",
    ],
  },
  {
    heading: "Children",
    paragraphs: [
      "The game is made for learners of many ages, but it is not directed at children under 13 and we do not knowingly collect personal information from anyone. Because ads may be shown, parents and guardians should supervise younger players.",
    ],
  },
  {
    heading: "Your choices",
    items: [
      "Delete local data at any time with Reset progress or by clearing browser data.",
      "Switch off sound and animations in Settings.",
      "Manage ad personalisation with Google's controls.",
      `Ask a question by writing to ${CONTACT_EMAIL}.`,
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "If this policy changes in a meaningful way, the date at the top changes too. Continuing to play after that means you accept the new version.",
    ],
  },
];

export const TERMS: readonly Section[] = [
  {
    heading: "Agreement",
    paragraphs: [
      `By opening or playing Code the Robot you agree to these terms. If you do not agree, please stop using the game. The game is operated by ${OPERATOR_NAME}.`,
    ],
  },
  {
    heading: "Using the game",
    paragraphs: [
      "You may play the game for personal, non-commercial purposes in an ordinary web browser. In return, please do not:",
    ],
    items: [
      "copy, resell or redistribute the game, its code, artwork or sounds as your own;",
      "use bots, scripts or other tools to farm rewards, edit saved data to claim rewards you did not earn, or interfere with how the game or its advertising works;",
      "click ads to generate revenue, or ask other people to do so.",
    ],
  },
  {
    heading: "Progress, coins and cosmetics",
    paragraphs: [
      "Everything is saved locally on your device, so we cannot recover progress lost when you clear browser data, switch browsers or devices, or reset the game. Coins, XP, stars and cosmetic items exist only inside the game. They have no cash value, cannot be bought with money, sold or transferred, and may be adjusted or reset if the game changes.",
    ],
  },
  {
    heading: "Advertising",
    paragraphs: [
      "The game may show third-party ads, including optional rewarded ads. Ads are provided by third parties and are not endorsed by us. A reward is given only when a rewarded ad completes as intended; if the ad service does not deliver an ad, no reward is given.",
    ],
  },
  {
    heading: "Ownership",
    paragraphs: [
      `The game's code, artwork, sound and written content belong to ${OPERATOR_NAME} or its licensors and are protected by copyright. Third-party names such as Google, React and Phaser belong to their owners.`,
    ],
  },
  {
    heading: "No warranty and limits of liability",
    paragraphs: [
      "The game is provided as is and as available, without any promise that it will be error-free, always available or suited to a particular purpose. To the extent the law allows, we are not liable for indirect or incidental losses arising from using the game, including lost progress. Nothing here limits rights that the law does not allow to be limited.",
    ],
  },
  {
    heading: "Changes and contact",
    paragraphs: [
      `We may update the game or these terms; the date at the top shows the latest version. Questions can be sent to ${CONTACT_EMAIL}.`,
    ],
  },
];

export const DISCLAIMER: readonly Section[] = [
  {
    heading: "Educational scope",
    paragraphs: [
      "Code the Robot is a game that practises problem-solving ideas used in programming. It simplifies those ideas on purpose. Blocks are not a real programming language, so what you learn here still needs practice in a real language before you rely on it. We make no promise about learning outcomes, grades or career results.",
    ],
  },
  {
    heading: "Difficulty and ratings",
    paragraphs: [
      "Levels are generated by rules and checked automatically, but a level can still feel easier or harder than its difficulty rating suggests. Stars, par values and achievements are game features, not assessments of ability.",
    ],
  },
  {
    heading: "Third-party content",
    paragraphs: [
      "Ads are supplied by third parties. Their appearance in the game is not an endorsement or recommendation, and we do not control their content beyond the settings the ad service gives us. Links to other sites are provided for convenience, and we are not responsible for what you find there.",
    ],
  },
  {
    heading: "No affiliation",
    paragraphs: [
      "Google, AdSense, React, Phaser and other product names mentioned in the game belong to their respective owners. They are used descriptively and do not imply any partnership or endorsement.",
    ],
  },
  {
    heading: "Accuracy",
    paragraphs: [
      "We work to keep the guides and instructions correct, but the game changes over time and some text may be out of date. If you notice a mistake, please tell us on the Contact page.",
    ],
  },
];

export const CONTACT: readonly Section[] = [
  {
    heading: "Get in touch",
    paragraphs: [
      `Write to us at ${CONTACT_EMAIL}. We read the messages we receive but cannot promise a reply to every one, and we cannot recover lost progress because it is stored only on your own device.`,
    ],
  },
  {
    heading: "What helps us fix a problem",
    items: [
      "The level number, for example 3-7, or the challenge mode you were playing.",
      "What you expected to happen and what happened instead.",
      "The program you built, described in words or shown in a screenshot.",
      "Your device and browser, for example Android 14 with Chrome.",
      "The technical summary you can copy with the button below.",
    ],
  },
  {
    heading: "Other messages",
    paragraphs: [
      "Feedback about levels, ideas for new puzzles, corrections to our guides, and questions about advertising or privacy are all welcome. Please do not send passwords or other sensitive information.",
    ],
  },
];