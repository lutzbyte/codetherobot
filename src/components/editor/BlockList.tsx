import { Fragment } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { commandCategoryColor } from "@/design/tokens";
import { resizeArgs } from "@/engine/builders";
import { commandForAction, commandForBlock } from "@/engine/commands";
import type { InstructionEdit } from "@/engine/editor";
import { functionLabel, parseSlotKey, slotKey } from "@/engine/program";
import type { Instruction, Program, SetOp, Slot } from "@/engine/program";
import { ConditionEditor } from "./ConditionEditor";
import { iconFor } from "./commandIcons";
import { useEditorContext } from "./EditorContext";
import { ValueSelect } from "./ValueSelect";
import styles from "./CommandEditor.module.css";

interface BlockListProps {
  slot: Slot;
  items: Program;
  /** Variabel dan parameter yang terlihat di dalam daftar ini. */
  scope: readonly string[];
  placeholder?: string;
}

/** Daftar instruksi untuk satu slot (program utama, fungsi, atau isi sebuah blok). */
export function BlockList({ slot, items, scope, placeholder }: BlockListProps) {
  const ctx = useEditorContext();
  const key = slotKey(slot);
  const overIndex = ctx.over && ctx.over.slot === key ? ctx.over.index : null;

  return (
    <div className={styles.slot} data-slot={key}>
      {items.length === 0 ? (
        <p className={`${styles.slotEmpty} ${overIndex === 0 ? styles.slotEmptyOver : ""}`}>
          {placeholder ?? "Tap or drag a command here."}
        </p>
      ) : null}

      {items.map((ins, index) => (
        <Fragment key={ins.id}>
          {overIndex === index ? <div className={styles.marker} aria-hidden="true" /> : null}
          <BlockItem
            ins={ins}
            index={index}
            count={items.length}
            parentKey={key}
            scope={scope}
          />
        </Fragment>
      ))}

      {items.length > 0 && overIndex === items.length ? (
        <div className={styles.marker} aria-hidden="true" />
      ) : null}
    </div>
  );
}

interface BlockItemProps {
  ins: Instruction;
  index: number;
  count: number;
  parentKey: string;
  scope: readonly string[];
}

function BlockItem({ ins, index, count, parentKey, scope }: BlockItemProps) {
  const ctx = useEditorContext();
  const def = ins.kind === "action" ? commandForAction(ins.action) : commandForBlock(ins.kind);
  const color = def ? commandCategoryColor[def.category] : "#5b6b95";
  const label = def?.label ?? ins.kind;
  const off = ctx.locked;

  const edit = (e: InstructionEdit) =>
    ctx.dispatch({ type: "edit", id: ins.id, edit: e });

  const onGripKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const slot = parseSlotKey(parentKey);
    if (!slot) return;
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      ctx.dispatch({ type: "relocate", id: ins.id, slot, index: index - 1 });
    } else if (e.key === "ArrowDown" && index < count - 1) {
      e.preventDefault();
      ctx.dispatch({ type: "relocate", id: ins.id, slot, index: index + 1 });
    }
  };

  let head: ReactNode;
  switch (ins.kind) {
    case "action":
      head = (
        <span className={styles.itemLabel}>
          {def ? <Icon name={iconFor(def.id)} size={16} /> : null}
          {label}
        </span>
      );
      break;
    case "repeat":
      head = (
        <>
          <span className={styles.kw}>Repeat</span>
          <ValueSelect
            value={ins.count}
            scope={scope}
            disabled={off}
            label="Repeat count"
            onChange={(count) => edit({ kind: "repeat", count })}
          />
          <span className={styles.kw}>times</span>
        </>
      );
      break;
    case "while":
      head = (
        <>
          <span className={styles.kw}>While</span>
          <ConditionEditor
            condition={ins.condition}
            scope={scope}
            disabled={off}
            onChange={(condition) => edit({ kind: "condition", condition })}
          />
        </>
      );
      break;
    case "if":
      head = (
        <>
          <span className={styles.kw}>If</span>
          <ConditionEditor
            condition={ins.condition}
            scope={scope}
            disabled={off}
            onChange={(condition) => edit({ kind: "condition", condition })}
          />
        </>
      );
      break;
    case "set": {
      const variables = ctx.variables.includes(ins.variable)
        ? ctx.variables
        : [...ctx.variables, ins.variable];
      head = (
        <>
          <span className={styles.kw}>Set</span>
          <select
            className={styles.select}
            aria-label="Variable"
            value={ins.variable}
            disabled={off}
            onChange={(e) =>
              edit({ kind: "set", variable: e.target.value, op: ins.op, value: ins.value })
            }
          >
            {variables.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            aria-label="Operation"
            value={ins.op}
            disabled={off}
            onChange={(e) => {
              const op: SetOp =
                e.target.value === "add" ? "add" : e.target.value === "sub" ? "sub" : "set";
              edit({ kind: "set", variable: ins.variable, op, value: ins.value });
            }}
          >
            <option value="set">=</option>
            <option value="add">+=</option>
            <option value="sub">−=</option>
          </select>
          <ValueSelect
            value={ins.value}
            scope={scope}
            disabled={off}
            label="Value"
            onChange={(value) =>
              edit({ kind: "set", variable: ins.variable, op: ins.op, value })
            }
          />
        </>
      );
      break;
    }
    case "call": {
      const target = ctx.functions.find((f) => f.id === ins.fn);
      const params = target?.params ?? [];
      head = (
        <>
          <select
            className={styles.select}
            aria-label="Function"
            value={ins.fn}
            disabled={off}
            onChange={(e) => {
              const next = ctx.functions.find((f) => f.id === e.target.value);
              edit({
                kind: "call",
                fn: e.target.value,
                args: resizeArgs(ins.args, next?.params.length ?? 0),
              });
            }}
          >
            {ctx.functions.map((f) => (
              <option key={f.id} value={f.id}>
                {functionLabel(f.id)}
              </option>
            ))}
          </select>
          {params.map((name, i) => (
            <span key={name} className={styles.arg}>
              <span className={styles.argName}>{name} =</span>
              <ValueSelect
                value={ins.args[i] ?? { kind: "number", value: 1 }}
                scope={scope}
                disabled={off}
                label={`Value for ${name}`}
                onChange={(value) =>
                  edit({
                    kind: "call",
                    fn: ins.fn,
                    args: resizeArgs(ins.args, params.length).map((a, j) =>
                      j === i ? value : a,
                    ),
                  })
                }
              />
            </span>
          ))}
        </>
      );
      break;
    }
  }

  const nested =
    ins.kind === "repeat" || ins.kind === "while" ? (
      <div className={styles.nested}>
        <BlockList
          slot={{ owner: "block", id: ins.id, slot: "body" }}
          items={ins.body}
          scope={scope}
        />
      </div>
    ) : ins.kind === "if" ? (
      <div className={styles.nested}>
        <BlockList
          slot={{ owner: "block", id: ins.id, slot: "then" }}
          items={ins.then}
          scope={scope}
          placeholder="Then: drop commands here"
        />
        <div className={styles.elseLabel}>Else</div>
        <BlockList
          slot={{ owner: "block", id: ins.id, slot: "else" }}
          items={ins.else}
          scope={scope}
          placeholder="Else: drop commands here"
        />
      </div>
    ) : null;

  const classes = [
    styles.item,
    ins.id === ctx.activeId ? (ctx.failed ? styles.itemFailed : styles.itemActive) : "",
    ins.id === ctx.draggingId ? styles.itemDragging : "",
  ].join(" ");

  return (
    <div className={classes} style={{ borderLeftColor: color }} data-queue-item>
      <div className={styles.head} data-item-head>
        <button
          type="button"
          className={styles.grip}
          disabled={off}
          aria-label={`Reorder ${label}. Use arrow keys or drag.`}
          onPointerDown={(e) =>
            ctx.startDrag(
              e,
              {
                kind: "reorder",
                instructionId: ins.id,
                fromSlot: parentKey,
                fromIndex: index,
              },
              label,
              color,
            )
          }
          onKeyDown={onGripKey}
        >
          <Icon name="grip" size={18} />
        </button>
        <div className={styles.headBody}>{head}</div>
        <button
          type="button"
          className={styles.remove}
          disabled={off}
          aria-label={`Remove ${label}`}
          onClick={() => ctx.dispatch({ type: "remove", id: ins.id })}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      {nested}
    </div>
  );
}