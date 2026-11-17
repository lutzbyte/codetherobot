import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import styles from "./MoreMenu.module.css";

interface MoreMenuProps {
  variant: "avatar" | "hamburger";
}

const ITEMS = [
  { to: "/daily", label: "Daily Challenge" },
  { to: "/collection", label: "Robot Collection" },
  { to: "/how-to-play", label: "How to Play" },
  { to: "/about", label: "About" },
];

export function MoreMenu({ variant }: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={variant === "avatar" ? styles.avatar : styles.hamburger}
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {variant === "hamburger" ? <Icon name="menu" size={26} /> : null}
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          {ITEMS.map((item) => (
            <Link key={item.to} to={item.to} role="menuitem" className={styles.item}>
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}