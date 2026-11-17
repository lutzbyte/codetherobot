import type { IconName } from "@/components/ui/Icon";

const COMMAND_ICONS: Record<string, IconName> = {
  move: "arrowUp",
  left: "turnLeft",
  right: "turnRight",
  collect: "star",
  interact: "bolt",
  wait: "clock",
  repeat: "repeat",
  while: "repeat",
  if: "diamond",
  set: "code",
  call: "step",
};

export function iconFor(commandId: string): IconName {
  return COMMAND_ICONS[commandId] ?? "diamond";
}