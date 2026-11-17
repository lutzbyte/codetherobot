import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "light" | "dark";
}

export function Card({
  tone = "light",
  className,
  children,
  ...rest
}: CardProps) {
  const cls = [styles.card, styles[tone], className ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}