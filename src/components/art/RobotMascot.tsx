import { useId } from "react";
import type { AccessoryId } from "@/engine/look";

interface RobotMascotProps {
  pose?: "idle" | "cheer";
  /** Warna aksen (antena, telinga, dada). */
  accent?: string;
  accessory?: AccessoryId;
  /** Hanya kepala (untuk logo). */
  head?: boolean;
  size?: number;
  x?: number;
  y?: number;
  className?: string;
}

const NAVY = "#16213e";
const EAR = "#2a3b68";
const LINE = "#cfd7ea";

function Accessory({ kind }: { kind: AccessoryId }) {
  switch (kind) {
    case "none":
      return null;
    case "cap":
      return (
        <g>
          <path d="M36 46 Q100 -8 164 46 Z" fill="#e5483d" />
          <rect x="120" y="40" width="64" height="9" rx="4.5" fill="#c23a30" />
        </g>
      );
    case "glasses":
      return (
        <g fill="none" stroke="#ffc21a" strokeWidth="5">
          <rect x="60" y="60" width="36" height="36" rx="14" />
          <rect x="104" y="60" width="36" height="36" rx="14" />
          <path d="M96 78h8" />
        </g>
      );
    case "bow":
      return (
        <g fill="#e8527a">
          <path d="M122 30 L150 14 L150 46 Z" />
          <path d="M178 30 L150 14 L150 46 Z" />
          <circle cx="150" cy="30" r="7" />
        </g>
      );
    case "crown":
      return (
        <path
          d="M56 30 L56 4 L78 18 L100 0 L122 18 L144 4 L144 30 Z"
          fill="#ffc21a"
          stroke="#c48f00"
          strokeWidth="2"
        />
      );
  }
}

export function RobotMascot({
  pose = "idle",
  accent = "#2f6bdb",
  accessory = "none",
  head = false,
  size = 200,
  x,
  y,
  className,
}: RobotMascotProps) {
  const gid = `rb-${useId().replace(/:/g, "")}`;
  const fill = `url(#${gid})`;
  const cheer = pose === "cheer";
  const viewBox = head ? "16 0 168 132" : "0 0 200 250";
  const height = head ? size * (132 / 168) : size * 1.25;

  return (
    <svg
      x={x}
      y={y}
      viewBox={viewBox}
      width={size}
      height={height}
      className={className}
      role="img"
      aria-label="Code the Robot mascot"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e1e8f6" />
        </linearGradient>
      </defs>

      {!head && (
        <g>
          <ellipse cx="100" cy="238" rx="52" ry="8" fill="rgba(0,0,0,0.16)" />

          <rect x="76" y="196" width="18" height="22" rx="8" fill={NAVY} />
          <rect x="106" y="196" width="18" height="22" rx="8" fill={NAVY} />
          <rect x="64" y="214" width="40" height="20" rx="10" fill={NAVY} />
          <rect x="96" y="214" width="40" height="20" rx="10" fill={NAVY} />

          {cheer ? (
            <g>
              <g transform="rotate(150 64 146)">
                <rect x="53" y="146" width="22" height="54" rx="11" fill={fill} stroke={LINE} strokeWidth="2" />
                <circle cx="64" cy="202" r="9" fill={NAVY} />
              </g>
              <g transform="rotate(-150 136 146)">
                <rect x="125" y="146" width="22" height="54" rx="11" fill={fill} stroke={LINE} strokeWidth="2" />
                <circle cx="136" cy="202" r="9" fill={NAVY} />
              </g>
            </g>
          ) : (
            <g>
              <rect x="40" y="140" width="22" height="54" rx="11" fill={fill} stroke={LINE} strokeWidth="2" />
              <circle cx="51" cy="198" r="9" fill={NAVY} />
              <rect x="138" y="140" width="22" height="54" rx="11" fill={fill} stroke={LINE} strokeWidth="2" />
              <circle cx="149" cy="198" r="9" fill={NAVY} />
            </g>
          )}

          <rect x="62" y="124" width="76" height="76" rx="26" fill={fill} stroke={LINE} strokeWidth="2" />
          <circle cx="100" cy="162" r="14" fill={accent} />
          <circle cx="100" cy="162" r="5" fill="#ffffff" />
        </g>
      )}

      <line x1="100" y1="30" x2="100" y2="11" stroke={NAVY} strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="9" r="7" fill={accent} />

      <circle cx="24" cy="80" r="15" fill={EAR} />
      <circle cx="24" cy="80" r="6" fill={accent} />
      <circle cx="176" cy="80" r="15" fill={EAR} />
      <circle cx="176" cy="80" r="6" fill={accent} />

      <rect x="28" y="28" width="144" height="102" rx="46" fill={fill} stroke={LINE} strokeWidth="2" />
      <rect x="46" y="48" width="108" height="66" rx="30" fill="#12203f" />
      <ellipse cx="78" cy="78" rx="11" ry="14" fill="#2ee6ff" />
      <ellipse cx="122" cy="78" rx="11" ry="14" fill="#2ee6ff" />
      <circle cx="82" cy="72" r="3.2" fill="#ffffff" />
      <circle cx="126" cy="72" r="3.2" fill="#ffffff" />
      <path d="M88 98 Q100 108 112 98" fill="none" stroke="#2ee6ff" strokeWidth="4" strokeLinecap="round" />

      <Accessory kind={accessory} />
    </svg>
  );
}