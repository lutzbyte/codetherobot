import { Link } from "react-router-dom";
import { Icon } from "./Icon";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
}

export function PageHeader({ title, subtitle, backTo }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {backTo ? (
        <Link to={backTo} className={styles.back} aria-label="Back">
          <Icon name="back" size={22} />
        </Link>
      ) : null}
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
    </header>
  );
}