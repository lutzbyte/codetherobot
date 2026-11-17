import { Icon } from "./Icon";

interface StarRowProps {
  earned: number;
  total?: number;
  size?: number;
}

export function StarRow({ earned, total = 3, size = 28 }: StarRowProps) {
  const stars = Array.from({ length: total }, (_, i) => i < earned);
  return (
    <div
      role="img"
      aria-label={`${earned} dari ${total} bintang`}
      style={{ display: "inline-flex", gap: 4 }}
    >
      {stars.map((on, i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          style={{
            color: on ? "var(--color-yellow-500)" : "rgba(255,255,255,0.25)",
          }}
        />
      ))}
    </div>
  );
}