import { useSyncExternalStore } from "react";
import type { ProgramRunner, RunState } from "@/engine/runner";

export function useRunnerState(runner: ProgramRunner): RunState {
  return useSyncExternalStore(runner.subscribe, runner.getState);
}