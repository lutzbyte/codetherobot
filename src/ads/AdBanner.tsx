import { useEffect, useRef, useState } from "react";
import { readAdsConfig } from "./config";
import styles from "./AdBanner.module.css";

interface AdsWindow extends Window {
  adsbygoogle?: unknown[];
}

const CONFIG = readAdsConfig();
/** Setiap elemen <ins> hanya boleh didorong sekali (StrictMode memanggil efek dua kali di mode dev). */
const pushed = new WeakSet<Element>();
let warnedMissingSlot = false;

interface AdBannerProps {
  placement: "world" | "play";
  /** True: tidak tampil di layar lebar (≥ 768 px), mis. saat iklan akan bersebelahan dengan jendela game. */
  mobileOnly?: boolean;
}

/**
 * Banner display AdSense. Hanya tampil jika mode iklan aktif, ID penerbit valid,
 * dan ID unit iklan untuk tempat ini diisi. Selalu diberi label "Advertisement".
 */
export function AdBanner({ placement, mobileOnly = false }: AdBannerProps) {
  const ref = useRef<HTMLModElement | null>(null);
  const [wide] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );

  const slot = placement === "world" ? CONFIG.slots.world : CONFIG.slots.play;
  const hidden = mobileOnly && wide;
  const live = CONFIG.mode !== "off" && CONFIG.client !== null && slot !== null && !hidden;

  useEffect(() => {
    if (CONFIG.mode !== "off" && slot === null && !warnedMissingSlot) {
      warnedMissingSlot = true;
      console.warn("[ads] No banner slot id configured; banners are not shown.");
    }
    const el = ref.current;
    if (!live || !el || pushed.has(el)) return;
    pushed.add(el);
    try {
      const w = window as AdsWindow;
      w.adsbygoogle = w.adsbygoogle ?? [];
      w.adsbygoogle.push({});
    } catch (error) {
      console.warn("[ads] Banner failed to load", error);
    }
  }, [live, slot]);

  if (hidden) return null;

  if (!live) {
    if (import.meta.env.DEV && CONFIG.mode === "off") {
      return <div className={styles.placeholder}>Ad space ({placement}) — ads are off</div>;
    }
    return null;
  }

  return (
    <aside className={styles.wrap} aria-label="Advertisement">
      <span className={styles.label}>Advertisement</span>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CONFIG.client ?? undefined}
        data-ad-slot={slot ?? undefined}
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-adtest={CONFIG.mode === "test" ? "on" : undefined}
      />
    </aside>
  );
}