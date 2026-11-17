import { useState } from "react";
import { RobotMascot } from "@/components/art/RobotMascot";
import { CoinPill } from "@/components/ui/CoinPill";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { toAccessory } from "@/engine/look";
import { useT } from "@/i18n";
import { achievementTitle } from "@/progress/achievements";
import { COSMETICS, isOwned, lookOf } from "@/progress/cosmetics";
import type { CosmeticItem, CosmeticSlot } from "@/progress/cosmetics";
import { equipCosmetic, purchaseCosmetic, useProgress } from "@/progress/progress";
import extra from "./phase7.module.css";
import styles from "./pages.module.css";

const TRAIL_COLORS: Record<string, string> = {
  none: "#c5cde0",
  dots: "#9fb4d8",
  stars: "#ffc21a",
  sparks: "#f5882a",
};

function Visual({ item, accent }: { item: CosmeticItem; accent: string }) {
  if (item.slot === "skin") {
    return <span className={styles.swatch} style={{ background: item.value }} />;
  }
  if (item.slot === "accessory") {
    return (
      <span className={extra.visual}>
        <RobotMascot head size={52} accent={accent} accessory={toAccessory(item.value)} />
      </span>
    );
  }
  const color = TRAIL_COLORS[item.value] ?? "#c5cde0";
  return (
    <span className={`${extra.visual} ${extra.trailDots}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={extra.trailDot}
          style={{ background: color, opacity: item.value === "none" ? 0.4 : 1 - i * 0.25 }}
        />
      ))}
    </span>
  );
}

export function CollectionPage() {
  const t = useT();
  const data = useProgress();
  const [tab, setTab] = useState<CosmeticSlot>("skin");
  const [message, setMessage] = useState<string | null>(null);
  const look = lookOf(data);

  const tabs: { slot: CosmeticSlot; label: string }[] = [
    { slot: "skin", label: t("col.skin") },
    { slot: "accessory", label: t("col.accessory") },
    { slot: "trail", label: t("col.trail") },
  ];

  const choose = (item: CosmeticItem) => {
    setMessage(null);
    if (isOwned(data, item)) {
      equipCosmetic(item.id);
      return;
    }
    if (item.unlock.kind === "coins") {
      const result = purchaseCosmetic(item.id);
      if (result.ok) equipCosmetic(item.id);
      else setMessage(t("col.needCoins"));
    }
  };

  return (
    <section className={styles.page}>
      <PageHeader title={t("col.title")} subtitle={t("col.subtitle")} />

      <div>
        <CoinPill amount={data.coins} />
      </div>

      <div className={styles.collection}>
        <div className={styles.preview}>
          <RobotMascot size={200} accent={look.accent} accessory={look.accessory} />
        </div>

        <div className={styles.page}>
          <div className={extra.tabs} role="tablist">
            {tabs.map(({ slot, label }) => (
              <button
                key={slot}
                type="button"
                role="tab"
                aria-selected={tab === slot}
                className={`${extra.tab} ${tab === slot ? extra.tabOn : ""}`}
                onClick={() => setTab(slot)}
              >
                {label}
              </button>
            ))}
          </div>

          {message ? (
            <p className={styles.muted} role="status">
              {message}
            </p>
          ) : null}

          <div className={styles.skinGrid}>
            {COSMETICS.filter((item) => item.slot === tab).map((item) => {
              const owned = isOwned(data, item);
              const equipped = data.equipped[item.slot] === item.id;
              const achievementLocked = item.unlock.kind === "achievement" && !owned;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={achievementLocked}
                  aria-pressed={equipped}
                  className={`${styles.skin} ${equipped ? styles.skinOn : ""}`}
                  onClick={() => choose(item)}
                >
                  <Visual item={item} accent={look.accent} />
                  <span>{item.name}</span>
                  {equipped ? (
                    <span className={`${styles.tag} ${styles.tagGreen}`}>{t("col.equipped")}</span>
                  ) : owned ? (
                    <span className={styles.tag}>{t("col.owned")}</span>
                  ) : item.unlock.kind === "coins" ? (
                    <span className={`${styles.tag} ${extra.price}`}>
                      <Icon name="coin" size={12} style={{ color: "var(--color-yellow-500)" }} />
                      {t("col.buy", { cost: item.unlock.cost })}
                    </span>
                  ) : item.unlock.kind === "achievement" ? (
                    <span className={styles.tag}>
                      <Icon name="lock" size={12} />{" "}
                      {t("col.locked", { name: achievementTitle(item.unlock.id) })}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}