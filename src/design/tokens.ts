import type { CommandCategory } from "@/engine/commands";

export const colors = {
  navy800: "#16213e",
  navy700: "#1f2d52",
  blue500: "#2f6bdb",
  yellow500: "#ffc21a",
  green500: "#3fb950",
  purple500: "#7a5af8",
  orange500: "#f5882a",
  white: "#ffffff",
  offwhite: "#f4f6fc",
} as const;

export const breakpoints = {
  tablet: 768,
  desktop: 1024,
} as const;

export const commandCategoryColor: Record<CommandCategory, string> = {
  move: colors.blue500,
  turn: colors.orange500,
  loop: colors.purple500,
  logic: colors.green500,
  action: "#2b9aa0",
  data: "#d49a00",
  function: "#a14fd0",
};