import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { useT } from "@/i18n";
import { ACHIEVEMENT_DEFS } from "@/progress/achievements";
import { useProgress } from "@/progress/progress";
import { levelProgress } from "@/progress/progressLogic";
import extra from "./phase7.module.css";
import styles from "./pages.module.css";

export function AchievementsPage() {
  const t = useT();
  const data = useProgress();
  const unlockedCount = ACHIEVEMENT_DEFS.filter(
    (def) => data.achievements[def.id] !== undefined,
  ).length;
  const xp = levelProgress(data.xp);

  return (
    <section className={styles.page}>
      <PageHeader
        title={t("ach.title")}
        subtitle={t("ach.subtitle", { done: unlockedCount, total: ACHIEVEMENT_DEFS.length })}
      />

      <article className={styles.card}>
        <div className={extra.levelHead}>
          <h2 className={styles.cardTitle}>{t("ach.level", { level: xp.level })}</h2>
          <span className={extra.stat}>
            {t("ach.xp", { current: xp.current, needed: xp.needed })}
          </span>
        </div>
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={xp.needed}
          aria-valuenow={xp.current}
          aria-label={t("ach.level", { level: xp.level })}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${Math.round((xp.current / xp.needed) * 100)}%` }}
          />
        </div>
      </article>

      <div className={styles.grid}>
        {ACHIEVEMENT_DEFS.map((def) => {
          const unlocked = data.achievements[def.id] !== undefined;
          const progress = Math.min(def.progress(data), def.target);
          const pct = Math.round((progress / def.target) * 100);
          return (
            <article key={def.id} className={styles.card}>
              <div className={styles.row}>
                <span
                  className={styles.badge}
                  style={{ background: unlocked ? "var(--color-yellow-500)" : "#b6bfd4" }}
                >
                  <Icon name={def.icon} size={26} />
                </span>
                <div className={styles.rowGrow}>
                  <h2 className={styles.cardTitle}>{def.title}</h2>
                  <p className={styles.muted}>{def.detail}</p>
                </div>
                {unlocked ? (
                  <span className={`${styles.tag} ${styles.tagGreen}`}>{t("ach.done")}</span>
                ) : (
                  <span className={styles.tag}>{t("ach.reward", { coins: def.reward })}</span>
                )}
              </div>
              <div
                className={styles.progress}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={def.target}
                aria-valuenow={progress}
                aria-label={def.title}
              >
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>
              <p className={styles.muted} style={{ marginTop: 6 }}>
                {progress} / {def.target}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}