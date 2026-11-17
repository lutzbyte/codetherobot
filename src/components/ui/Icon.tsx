import type { ReactElement, SVGProps } from "react";

export type IconName =
  | "play"
  | "home"
  | "worlds"
  | "star"
  | "settings"
  | "coin"
  | "lock"
  | "check"
  | "back"
  | "trophy"
  | "code"
  | "paint"
  | "pause"
  | "reset"
  | "step"
  | "hint"
  | "arrowUp"
  | "turnLeft"
  | "turnRight"
  | "repeat"
  | "diamond"
  | "menu"
  | "flag"
  | "close"
  | "undo"
  | "redo"
  | "grip"
  | "clock"
  | "bolt";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const paths: Record<IconName, ReactElement> = {
  play: <path d="M7 4.5v15l13-7.5z" fill="currentColor" />,
  home: (
    <path
      d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
      fill="currentColor"
    />
  ),
  worlds: (
    <g {...stroke} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </g>
  ),
  star: (
    <path
      d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"
      fill="currentColor"
    />
  ),
  settings: (
    <g {...stroke} strokeWidth={2}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8l1.6 2.2 2.7-.5.9 2.6 2.5 1.2-.7 2.7 1.5 2.3-2 1.9.1 2.8-2.7.7-1.5 2.3-2.7-.5L12 21.2l-1.7-2.5-2.7.5-1.5-2.3-2.7-.7.1-2.8-2-1.9L1.8 9.3l2.5-1.2.9-2.6 2.7.5z" />
    </g>
  ),
  coin: (
    <g>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="#fff"
        strokeOpacity=".55"
        strokeWidth="1.6"
      />
    </g>
  ),
  lock: (
    <g>
      <rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor" />
      <path
        d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </g>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} strokeWidth={3} />,
  back: <path d="M15 5 8 12l7 7" {...stroke} strokeWidth={2.6} />,
  trophy: (
    <g>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="currentColor" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" {...stroke} strokeWidth={1.8} />
      <rect x="10.5" y="14" width="3" height="4" fill="currentColor" />
      <rect x="7.5" y="18" width="9" height="2.5" rx="1" fill="currentColor" />
    </g>
  ),
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" {...stroke} />,
  paint: (
    <g>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle cx="8" cy="10" r="1.8" fill="#fff" />
      <circle cx="12" cy="7.5" r="1.8" fill="#fff" />
      <circle cx="16" cy="10" r="1.8" fill="#fff" />
      <circle cx="9" cy="15" r="1.8" fill="#fff" />
    </g>
  ),
  pause: (
    <g fill="currentColor">
      <rect x="6" y="4.5" width="4.5" height="15" rx="1.5" />
      <rect x="13.5" y="4.5" width="4.5" height="15" rx="1.5" />
    </g>
  ),
  reset: <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" {...stroke} />,
  step: (
    <g>
      <path d="M5 4.5v15l11-7.5z" fill="currentColor" />
      <path d="M19.5 5v14" {...stroke} />
    </g>
  ),
  hint: (
    <path
      d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"
      {...stroke}
      strokeWidth={2}
    />
  ),
  arrowUp: <path d="M12 20V5M5 12l7-7 7 7" {...stroke} strokeWidth={2.8} />,
  turnLeft: <path d="M9 6 4 10.5 9 15M4 10.5h10a5 5 0 0 1 0 10h-3" {...stroke} />,
  turnRight: <path d="M15 6l5 4.5-5 4.5M20 10.5H10a5 5 0 0 0 0 10h3" {...stroke} />,
  repeat: (
    <path
      d="M17 3l3 3-3 3M20 6H8a4 4 0 0 0-4 4M7 21l-3-3 3-3M4 18h12a4 4 0 0 0 4-4"
      {...stroke}
      strokeWidth={2.2}
    />
  ),
  diamond: (
    <g>
      <path d="M12 2.5l9.5 9.5-9.5 9.5L2.5 12z" fill="currentColor" />
      <path d="M12 7.5l4.5 4.5-4.5 4.5L7.5 12z" fill="#fff" fillOpacity=".9" />
    </g>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" {...stroke} />,
  flag: (
    <g>
      <path d="M6 21V4" {...stroke} />
      <path d="M6 5h12l-3 4 3 4H6z" fill="currentColor" />
    </g>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" {...stroke} />,
  undo: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" {...stroke} />,
  redo: <path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" {...stroke} />,
  grip: (
    <g fill="currentColor">
      <circle cx="9" cy="6" r="1.8" />
      <circle cx="15" cy="6" r="1.8" />
      <circle cx="9" cy="12" r="1.8" />
      <circle cx="15" cy="12" r="1.8" />
      <circle cx="9" cy="18" r="1.8" />
      <circle cx="15" cy="18" r="1.8" />
    </g>
  ),
  clock: (
    <g {...stroke} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </g>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" />,
};

export function Icon({ name, size = 24, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}