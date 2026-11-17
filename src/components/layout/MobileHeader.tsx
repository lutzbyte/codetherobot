import { Link } from "react-router-dom";
import { RobotMascot } from "@/components/art/RobotMascot";
import { CoinLink } from "@/components/ui/CoinLink";
import { MoreMenu } from "./MoreMenu";
import styles from "./MobileHeader.module.css";

export function MobileHeader() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand} aria-label="Code the Robot">
        <RobotMascot head size={36} />
        <span className={styles.text}>
          Code
          <br />
          the Robot
        </span>
      </Link>
      <div className={styles.right}>
        <CoinLink compact />
        <MoreMenu variant="hamburger" />
      </div>
    </header>
  );
}