import { createContext, useContext } from "react";
import type { Dispatch, PointerEvent as ReactPointerEvent } from "react";
import type { EditorAction } from "@/engine/editor";
import type { FunctionDef } from "@/engine/program";
import type { DragPayload, DropTarget } from "./useCommandDrag";

export interface EditorContextValue {
  dispatch: Dispatch<EditorAction>;
  /** True saat program berjalan atau dijeda: editor dikunci. */
  locked: boolean;
  activeId: number | null;
  failed: boolean;
  /** Variabel global yang tersedia di level. */
  variables: readonly string[];
  functions: readonly FunctionDef[];
  startDrag: (
    e: ReactPointerEvent<HTMLElement>,
    payload: DragPayload,
    label: string,
    color: string,
  ) => void;
  over: DropTarget | null;
  draggingId: number | null;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorProvider = EditorContext.Provider;

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("EditorContext is missing");
  return ctx;
}