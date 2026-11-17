import type { Value } from "@/engine/program";
import styles from "./CommandEditor.module.css";

const NUMBERS = Array.from({ length: 11 }, (_, i) => i);

function encode(v: Value): string {
  return v.kind === "number" ? `n:${v.value}` : `v:${v.name}`;
}

function decode(raw: string): Value {
  if (raw.startsWith("v:")) return { kind: "var", name: raw.slice(2) };
  const n = Number(raw.slice(2));
  return { kind: "number", value: Number.isFinite(n) ? n : 0 };
}

interface ValueSelectProps {
  value: Value;
  /** Nama variabel dan parameter yang boleh dipilih. */
  scope: readonly string[];
  disabled: boolean;
  label: string;
  onChange: (value: Value) => void;
}

export function ValueSelect({ value, scope, disabled, label, onChange }: ValueSelectProps) {
  const options = [
    ...NUMBERS.map((n) => ({ value: `n:${n}`, label: String(n) })),
    ...scope.map((name) => ({ value: `v:${name}`, label: name })),
  ];
  const current = encode(value);
  if (!options.some((o) => o.value === current)) {
    options.push({
      value: current,
      label: value.kind === "number" ? String(value.value) : value.name,
    });
  }

  return (
    <select
      className={styles.select}
      aria-label={label}
      value={current}
      disabled={disabled}
      onChange={(e) => onChange(decode(e.target.value))}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}