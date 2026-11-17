import { Link } from "react-router-dom";
import { useProgress } from "@/progress/progress";
import { CoinPill } from "./CoinPill";

interface CoinLinkProps {
  compact?: boolean;
}

/** Saldo koin yang bisa diketuk untuk membuka Collection, tempat koin dibelanjakan. */
export function CoinLink({ compact = false }: CoinLinkProps) {
  const { coins } = useProgress();
  return (
    <Link
      to="/collection"
      aria-label={`${coins} coins. Open the robot collection.`}
      style={{ display: "inline-flex" }}
    >
      <CoinPill amount={coins} compact={compact} />
    </Link>
  );
}