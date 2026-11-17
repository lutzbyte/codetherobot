import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  hint?: string;
  action?: ReactNode;
}

/** Tampilan ramah saat tidak ada isi atau halaman tidak ditemukan. */
export function EmptyState({ icon = "flag", title, hint, action }: EmptyStateProps) {
  return (
    <div className={styles.wrap} role="status">
      <span className={styles.icon}>
        <Icon name={icon} size={32} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {action}
    </div>
  );
}