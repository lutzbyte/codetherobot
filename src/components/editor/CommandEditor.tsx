import { useEffect } from "react";
import type { Dispatch } from "react";
import { Icon } from "@/components/ui/Icon";
import { commandCategoryColor } from "@/design/tokens";
import { COMMANDS, DEFAULT_COMMAND_IDS } from "@/engine/commands";
import { countAll, isDropAllowed } from "@/engine/editor";
import type { EditorAction, EditorState } from "@/engine/editor";
import {
  MAIN_SLOT,
  PARAM_NAMES,
  functionLabel,
  parseSlotKey,
} from "@/engine/program";
import type { LevelDef } from "@/engine/types";
import { BlockList } from "./BlockList";
import { iconFor } from "./commandIcons";
import { EditorProvider } from "./EditorContext";
import { useCommandDrag } from "./useCommandDrag";
import type { DropTarget } from "./useCommandDrag";
import styles from "./CommandEditor.module.css";

interface CommandEditorProps {
  editor: EditorState;
  dispatch: Dispatch<EditorAction>;
  level: LevelDef;
  limit: number;
  /** True saat program sedang berjalan atau dijeda: editor dikunci. */
  locked: boolean;
  activeId: number | null;
  failed: boolean;
}

export function CommandEditor({
  editor,
  dispatch,
  level,
  limit,
  locked,
  activeId,
  failed,
}: CommandEditorProps) {
  const total = countAll(editor);
  const full = total >= limit;
  const variables = level.variables ?? [];

  const addCommand = (commandId: string, target?: DropTarget) => {
    const def = COMMANDS.find((c) => c.id === commandId);
    if (!def) return;
    const slot = (target ? parseSlotKey(target.slot) : null) ?? MAIN_SLOT;
    const index = target?.index;
    if (def.action) {
      dispatch({ type: "add", action: def.action, slot, index, limit });
    } else if (def.block) {
      dispatch({
        type: "addBlock",
        block: def.block,
        slot,
        index,
        limit,
        variable: variables[0],
      });
    }
  };

  const { view, startDrag } = useCommandDrag({
    disabled: locked,
    canDrop: (payload, slotText) => {
      if (payload.kind === "palette") return true;
      const slot = parseSlotKey(slotText);
      return slot ? isDropAllowed(editor, payload.instructionId, slot) : false;
    },
    onTap: (commandId) => addCommand(commandId),
    onDropPalette: (commandId, target) => addCommand(commandId, target),
    onDropReorder: (payload, target) => {
      const slot = parseSlotKey(target.slot);
      if (!slot) return;
      const sameSlot = target.slot === payload.fromSlot;
      const index =
        sameSlot && target.index > payload.fromIndex ? target.index - 1 : target.index;
      if (sameSlot && index === payload.fromIndex) return;
      dispatch({ type: "relocate", id: payload.instructionId, slot, index });
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || locked) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, dispatch]);

  const allowedIds = level.allowedCommands ?? DEFAULT_COMMAND_IDS;
  const palette = COMMANDS.filter(
    (def) =>
      allowedIds.includes(def.id) && (def.id !== "call" || editor.functions.length > 0),
  );

  const draggingId =
    view?.payload.kind === "reorder" ? view.payload.instructionId : null;

  return (
    <EditorProvider
      value={{
        dispatch,
        locked,
        activeId,
        failed,
        variables,
        functions: editor.functions,
        startDrag,
        over: view?.over ?? null,
        draggingId,
      }}
    >
      <div className={styles.editor}>
        <h2 className={styles.title}>Commands</h2>

        {level.tutorial ? <p className={styles.tutorial}>{level.tutorial}</p> : null}

        <div className={styles.palette}>
          {palette.map((def) => {
            const color = commandCategoryColor[def.category];
            return (
              <button
                key={def.id}
                type="button"
                className={styles.cmd}
                style={{ background: color }}
                disabled={locked || full}
                onPointerDown={(e) =>
                  startDrag(e, { kind: "palette", commandId: def.id }, def.label, color)
                }
                onClick={(e) => {
                  // Aktivasi keyboard (detail === 0). Tap pointer ditangani di hook drag.
                  if (e.detail === 0) addCommand(def.id);
                }}
              >
                <Icon name={iconFor(def.id)} size={22} />
                <span className={styles.cmdLabel}>{def.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.programHead}>
          <h3 className={styles.sub}>
            Program{" "}
            <span className={full ? styles.countFull : styles.count}>
              {total} / {limit}
            </span>
          </h3>
          <div className={styles.tools}>
            <button
              type="button"
              className={styles.tool}
              aria-label="Undo"
              disabled={locked || editor.past.length === 0}
              onClick={() => dispatch({ type: "undo" })}
            >
              <Icon name="undo" size={18} />
            </button>
            <button
              type="button"
              className={styles.tool}
              aria-label="Redo"
              disabled={locked || editor.future.length === 0}
              onClick={() => dispatch({ type: "redo" })}
            >
              <Icon name="redo" size={18} />
            </button>
            <button
              type="button"
              className={styles.tool}
              aria-label="Clear program"
              disabled={locked || total === 0}
              onClick={() => dispatch({ type: "clear" })}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        <BlockList
          slot={MAIN_SLOT}
          items={editor.program}
          scope={variables}
          placeholder="Tap or drag a command here to build your program."
        />

        {editor.functions.map((fn) => (
          <section key={fn.id} className={styles.fnBox}>
            <div className={styles.fnHead}>
              <strong>{functionLabel(fn.id)}</strong>
              <span className={styles.params}>({fn.params.join(", ")})</span>
              <span className={styles.spacer} />
              <button
                type="button"
                className={styles.miniBtn}
                disabled={locked || fn.params.length >= PARAM_NAMES.length}
                onClick={() =>
                  dispatch({
                    type: "setParams",
                    fn: fn.id,
                    params: [
                      ...fn.params,
                      PARAM_NAMES.find((p) => !fn.params.includes(p)) ?? "n",
                    ],
                  })
                }
              >
                + value
              </button>
              <button
                type="button"
                className={styles.miniBtn}
                disabled={locked || fn.params.length === 0}
                onClick={() =>
                  dispatch({
                    type: "setParams",
                    fn: fn.id,
                    params: fn.params.slice(0, -1),
                  })
                }
              >
                − value
              </button>
            </div>
            <BlockList
              slot={{ owner: "fn", fn: fn.id }}
              items={fn.body}
              scope={[...variables, ...fn.params]}
              placeholder="Drop this function's commands here."
            />
          </section>
        ))}

        {view ? (
          <div
            className={styles.ghost}
            style={{ left: view.x, top: view.y, background: view.color }}
          >
            {view.label}
          </div>
        ) : null}
      </div>
    </EditorProvider>
  );
}