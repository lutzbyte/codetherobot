import { Link } from "react-router-dom";
import { WorldArt } from "@/components/art/WorldArt";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { LEVELS_PER_WORLD, WORLDS } from "@/data/uiData";
import type { WorldInfo } from "@/data/uiData";
import { useProgress } from "@/progress/progress";
import {
  WORLD_UNLOCK_REQUIREMENT,
  isWorldUnlocked,
  levelsDone,
} from "@/progress/progressLogic";
import { useSettings } from "@/state/settings";
import styles from "./WorldsPage.module.css";

interface WorldCardProps {
  world: WorldInfo;
  done: number;
  unlocked: boolean;
}

function WorldCard({ world, done, unlocked }: WorldCardProps) {
  const completed = done >= LEVELS_PER_WORLD;
  const previous = WORLDS.find((w) => w.id === world.id - 1);
  const description = unlocked
    ? world.description
    : `Finish ${WORLD_UNLOCK_REQUIREMENT} levels of ${previous?.title ?? "the previous world"} to unlock.`;

  const body = (
    <>
      <WorldArt theme={world.theme} className={styles.thumb} />
      <div className={styles.info}>
        <h2 className={styles.name}>
          {world.id}. {world.title}
        </h2>
        <p className={styles.desc}>{description}</p>
        <p className={styles.stars}>
          <Icon name="star" size={18} style={{ color: "var(--color-yellow-500)" }} />
          {done} / {LEVELS_PER_WORLD}
        </p>
      </div>
      <span className={styles.status} aria-hidden="true">
        {completed ? (
          <span className={styles.done}>
            <Icon name="check" size={18} />
          </span>
        ) : !unlocked ? (
          <Icon name="lock" size={24} />
        ) : null}
      </span>
    </>
  );

  if (!unlocked) {
    return (
      <div className={`${styles.card} ${styles.locked}`} aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link to={`/worlds/${world.id}`} className={styles.card}>
      {body}
    </Link>
  );
}

export function WorldsPage() {
  const progress = useProgress();
  const { unlockAll } = useSettings();

  return (
    <section className={styles.page}>
      <PageHeader title="Worlds" subtitle="Choose your adventure" />
      <div className={styles.panel}>
        <div className={styles.list}>
          {WORLDS.map((world) => (
            <WorldCard
              key={world.id}
              world={world}
              done={levelsDone(progress, world.id)}
              unlocked={isWorldUnlocked(progress, world.id, unlockAll)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}