import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { CoinLink } from "@/components/ui/CoinLink";
import { RobotMascot } from "@/components/art/RobotMascot";
import { useT } from "@/i18n";
import { MoreMenu } from "./MoreMenu";
import { desktopNavItems } from "./navItems";
import styles from "./TopNav.module.css";

export function TopNav() {
  const t = useT();

  return (
    <header className={styles.nav}>
      <NavLink to="/" className={styles.brand} aria-label="Code the Robot">
        <RobotMascot head size={44} />
        <span className={styles.brandText}>
          Code
          <br />
          the Robot
        </span>
      </NavLink>

      <nav className={styles.links} aria-label="Main navigation">
        {desktopNavItems.map((item) => (
          <NavLink
            key={item.labelKey}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [styles.link, isActive ? styles.active : ""].join(" ")
            }
          >
            <Icon name={item.icon} size={20} />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.right}>
        <CoinLink />
        <MoreMenu variant="avatar" />
      </div>
    </header>
  );
}