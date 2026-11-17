import { Icon } from "./Icon";
import styles from "./CoinPill.module.css";

interface CoinPillProps {
  amount: number;
  /** Versi kecil untuk header ponsel. */
  compact?: boolean;
}

export function CoinPill({ amount, compact = false }: CoinPillProps) {
  return (
    <div
      className={`${styles.pill} ${compact ? styles.compact : ""}`}
      aria-label={`${amount} coins`}
    >
      <Icon
        name="coin"
        size={compact ? 18 : 22}
        style={{ color: "var(--color-yellow-500)" }}
      />
      <span>{amount}</span>
    </div>
  );
}