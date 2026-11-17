import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useT } from "@/i18n";
import { mobileNavItems } from "./navItems";
import styles from "./BottomNav.module.css";

export function BottomNav() {
  const t = useT();

  return (
    <nav className={styles.nav} aria-label="Bottom navigation">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.labelKey}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            [styles.item, isActive ? styles.active : ""].join(" ")
          }
        >
          <Icon name={item.icon} size={24} />
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}