import { Link, useParams } from "react-router-dom";
import { AdBanner } from "@/ads/AdBanner";
import { WORLD_GUIDES } from "@/content/worldGuides";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { StarRow } from "@/components/ui/StarRow";
import { getLevelDef } from "@/data/levelLookup";
import { LEVELS_PER_WORLD, WORLDS } from "@/data/uiData";
import { useProgress } from "@/progress/progress";
import { isLevelUnlocked, levelsDone } from "@/progress/progressLogic";
import { useSettings } from "@/state/settings";
import styles from "./pages.module.css";

function DifficultyDots({ value }: { value: number }) {
  return (
    <span
      role="img"
      aria-label={`Difficulty ${value} of 5`}
      style={{ display: "inline-flex", gap: 3 }}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: i < value ? "var(--color-yellow-500)" : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </span>
  );
}

export function LevelsPage() {
  const { worldId } = useParams();
  const progress = useProgress();
  const { unlockAll } = useSettings();
  const world = WORLDS.find((w) => String(w.id) === worldId);

  if (!world) {
    return (
      <section className={styles.page}>
        <PageHeader title="World not found" backTo="/worlds" />
        <div className={`${styles.card} ${styles.emptyState}`}>
          <p className={styles.muted}>This world does not exist.</p>
          <Link to="/worlds" className={styles.tag}>
            Back to Worlds
          </Link>
        </div>
      </section>
    );
  }

  const guide = WORLD_GUIDES[world.id];
  const levels = Array.from({ length: LEVELS_PER_WORLD }, (_, i) => {
    const number = i + 1;
    const id = `${world.id}-${number}`;
    return {
      id,
      number,
      stars: progress.levels[id]?.stars ?? 0,
      unlocked: isLevelUnlocked(progress, id, unlockAll),
      difficulty: getLevelDef(id).difficulty ?? 1,
    };
  });

  return (
    <section className={styles.page}>
      <PageHeader
        title={`${world.id}. ${world.title}`}
        subtitle={`${levelsDone(progress, world.id)} / ${LEVELS_PER_WORLD} levels completed`}
        backTo="/worlds"
      />
      <div className={styles.levelGrid}>
        {levels.map((level) =>
          level.unlocked ? (
            <Link
              key={level.id}
              to={`/play/${level.id}`}
              className={styles.levelTile}
              style={{ minHeight: 110 }}
            >
              <span>{level.number}</span>
              <StarRow earned={level.stars} size={14} />
              <DifficultyDots value={level.difficulty} />
            </Link>
          ) : (
            <div
              key={level.id}
              className={`${styles.levelTile} ${styles.levelLocked}`}
              style={{ minHeight: 110 }}
              aria-disabled="true"
            >
              <Icon name="lock" size={26} />
              <span className={styles.muted} style={{ color: "var(--text-muted-dark)" }}>
                {level.number}
              </span>
            </div>
          ),
        )}
      </div>

      {guide ? (
        <article className={styles.card} style={{ maxWidth: "72ch" }}>
          <h2 className={styles.cardTitle}>What you will practise in {world.title}</h2>
          <p style={{ marginTop: 8, lineHeight: 1.65 }}>{guide.intro}</p>
          <dl style={{ margin: "12px 0 0", display: "grid", gap: 12 }}>
            {guide.ideas.map((idea) => (
              <div key={idea.term}>
                <dt style={{ fontWeight: 800 }}>{idea.term}</dt>
                <dd style={{ margin: "2px 0 0", lineHeight: 1.6 }}>{idea.text}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.muted} style={{ marginTop: 12 }}>
            New to the editor? Read <Link to="/how-to-play" style={{ textDecoration: "underline" }}>How to Play</Link>.
          </p>
        </article>
      ) : null}

      <AdBanner placement="world" />
    </section>
  );
}