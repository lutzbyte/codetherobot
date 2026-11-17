import { num, vr } from "@/engine/builders";
import { COMPARE_OPS } from "@/engine/program";
import type { Clause, Condition } from "@/engine/program";
import { SENSORS } from "@/engine/sensors";
import { ValueSelect } from "./ValueSelect";
import styles from "./CommandEditor.module.css";

const DEFAULT_CLAUSE: Clause = { kind: "sensor", sensor: "pathAhead", not: false };
const MAX_CLAUSES = 3;

interface ConditionEditorProps {
  condition: Condition;
  /** Variabel dan parameter yang bisa dipakai untuk perbandingan. */
  scope: readonly string[];
  disabled: boolean;
  onChange: (condition: Condition) => void;
}

export function ConditionEditor({
  condition,
  scope,
  disabled,
  onChange,
}: ConditionEditorProps) {
  const setClause = (index: number, clause: Clause) =>
    onChange({
      ...condition,
      clauses: condition.clauses.map((c, i) => (i === index ? clause : c)),
    });

  const removeClause = (index: number) =>
    onChange({ ...condition, clauses: condition.clauses.filter((_, i) => i !== index) });

  const addClause = () =>
    onChange({ ...condition, clauses: [...condition.clauses, DEFAULT_CLAUSE] });

  const pickKind = (index: number, clause: Clause, raw: string) => {
    if (raw === "cmp") {
      const first = scope[0];
      setClause(index, {
        kind: "compare",
        left: first ? vr(first) : num(0),
        op: ">",
        right: num(0),
      });
      return;
    }
    const found = SENSORS.find((s) => s.id === raw);
    if (!found) return;
    setClause(index, {
      kind: "sensor",
      sensor: found.id,
      not: clause.kind === "sensor" ? clause.not : false,
    });
  };

  return (
    <div className={styles.cond}>
      {condition.clauses.map((clause, index) => (
        <div key={index} className={styles.clause}>
          {index > 0 ? (
            <select
              className={styles.select}
              aria-label="Join conditions"
              value={condition.join}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...condition, join: e.target.value === "or" ? "or" : "and" })
              }
            >
              <option value="and">and</option>
              <option value="or">or</option>
            </select>
          ) : null}

          {clause.kind === "sensor" ? (
            <button
              type="button"
              className={`${styles.notBtn} ${clause.not ? styles.notOn : ""}`}
              aria-pressed={clause.not}
              disabled={disabled}
              onClick={() => setClause(index, { ...clause, not: !clause.not })}
            >
              not
            </button>
          ) : null}

          <select
            className={styles.select}
            aria-label="Condition"
            value={clause.kind === "compare" ? "cmp" : clause.sensor}
            disabled={disabled}
            onChange={(e) => pickKind(index, clause, e.target.value)}
          >
            {SENSORS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
            {scope.length > 0 || clause.kind === "compare" ? (
              <option value="cmp">compare numbers</option>
            ) : null}
          </select>

          {clause.kind === "compare" ? (
            <>
              <ValueSelect
                value={clause.left}
                scope={scope}
                disabled={disabled}
                label="Left value"
                onChange={(left) => setClause(index, { ...clause, left })}
              />
              <select
                className={styles.select}
                aria-label="Comparison"
                value={clause.op}
                disabled={disabled}
                onChange={(e) => {
                  const op = COMPARE_OPS.find((o) => o === e.target.value);
                  if (op) setClause(index, { ...clause, op });
                }}
              >
                {COMPARE_OPS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <ValueSelect
                value={clause.right}
                scope={scope}
                disabled={disabled}
                label="Right value"
                onChange={(right) => setClause(index, { ...clause, right })}
              />
            </>
          ) : null}

          {condition.clauses.length > 1 ? (
            <button
              type="button"
              className={styles.miniBtn}
              aria-label="Remove condition"
              disabled={disabled}
              onClick={() => removeClause(index)}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}

      {condition.clauses.length < MAX_CLAUSES ? (
        <button
          type="button"
          className={styles.miniBtn}
          aria-label="Add condition"
          disabled={disabled}
          onClick={addClause}
        >
          + and / or
        </button>
      ) : null}
    </div>
  );
}