import { Link } from "react-router-dom";
import { SITE_NAME } from "@/site/siteInfo";
import styles from "./SiteFooter.module.css";

const LINKS: readonly (readonly [string, string])[] = [
  ["/how-to-play", "How to play"],
  ["/about", "About"],
  ["/privacy", "Privacy Policy"],
  ["/terms", "Terms of Service"],
  ["/disclaimer", "Disclaimer"],
  ["/contact", "Contact"],
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <nav aria-label="Site information" className={styles.links}>
        {LINKS.map(([to, label]) => (
          <Link key={to} to={to} className={styles.link}>
            {label}
          </Link>
        ))}
      </nav>
      <p className={styles.copy}>
        © {new Date().getFullYear()} {SITE_NAME}
      </p>
    </footer>
  );
}