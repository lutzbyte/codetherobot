import { IsoCube, IsoTree } from "./IsoShapes";

interface HeroSceneProps {
  className?: string;
}

const STONE = { top: "#aab2c1", left: "#818a9c", right: "#677085" };

export function HeroScene({ className }: HeroSceneProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 1000 440"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcd6fb" />
          <stop offset="1" stopColor="#eef4ff" />
        </linearGradient>
        <linearGradient id="hs-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f6f9ff" stopOpacity="1" />
          <stop offset="0.4" stopColor="#f6f9ff" stopOpacity="0.88" />
          <stop offset="0.68" stopColor="#f6f9ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1000" height="440" fill="url(#hs-sky)" />

      <g fill="#ffffff" opacity="0.9">
        <ellipse cx="540" cy="90" rx="70" ry="20" />
        <ellipse cx="590" cy="76" rx="48" ry="20" />
        <ellipse cx="860" cy="64" rx="64" ry="18" />
        <ellipse cx="900" cy="52" rx="40" ry="16" />
        <ellipse cx="300" cy="130" rx="60" ry="16" />
      </g>

      <polygon points="470,330 640,170 760,260 860,150 1000,260 1000,440 470,440" fill="#aebbd6" />

      <g>
        <rect x="640" y="150" width="170" height="190" fill="#b4bfd6" />
        <rect x="600" y="110" width="50" height="230" fill="#c2cce0" />
        <polygon points="594,110 625,30 656,110" fill="#5d6f9e" />
        <rect x="800" y="120" width="50" height="220" fill="#c2cce0" />
        <polygon points="794,120 825,40 856,120" fill="#5d6f9e" />
        <rect x="690" y="80" width="64" height="100" fill="#c7d0e3" />
        <polygon points="684,80 722,0 760,80" fill="#5d6f9e" />
        <g fill="#5d6f9e">
          <rect x="618" y="160" width="14" height="26" rx="7" />
          <rect x="818" y="170" width="14" height="26" rx="7" />
          <rect x="708" y="110" width="14" height="26" rx="7" />
          <rect x="690" y="220" width="22" height="40" rx="11" />
          <rect x="742" y="220" width="22" height="40" rx="11" />
        </g>
      </g>

      <path d="M420 440 V350 Q560 300 720 340 T1000 320 V440 Z" fill="#6bbf4a" />
      <path d="M560 440 V385 Q720 350 860 385 T1000 370 V440 Z" fill="#4f9a3a" />

      <IsoTree x={880} y={350} r={30} />
      <IsoTree x={950} y={372} r={24} />
      <IsoTree x={470} y={380} r={22} />

      <IsoCube x={640} y={380} s={70} h={60} {...STONE} />
      <IsoCube x={760} y={400} s={56} h={50} {...STONE} />
      <IsoCube x={570} y={410} s={48} h={40} {...STONE} />

      <rect width="1000" height="440" fill="url(#hs-fade)" />
    </svg>
  );
}