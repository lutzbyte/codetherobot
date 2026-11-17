import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { maybeShowInterstitial } from "@/ads/adService";
import { useRewarded } from "@/ads/useRewarded";
import { playSfx } from "@/audio";
import { RobotMascot } from "@/components/art/RobotMascot";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { nextLevelId } from "@/data/uiData";
import { achievementTitle } from "@/progress/achievements";
import { lookOf } from "@/progress/cosmetics";
import {
  canClaimAdBonus,
  claimAdBonus,
  getLastResult,
  useProgress,
} from "@/progress/progress";
import { isLevelUnlocked } from "@/progress/progressLogic";
import { useSettings } from "@/state/settings";
import styles from "./CompletePage.module.css";

const CONFETTI_COLORS = ["#3fb950", "#2f6bdb", "#f5882a", "#ffc21a"];

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 6) * 0.35,
  size: 6 + (i % 3) * 3,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? "#2f6bdb",
}));

export function CompletePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const progress = useProgress();
  const { unlockAll } = useSettings();
  const rewarded = useRewarded();

  const [navigating, setNavigating] = useState(false);
  const [bonus, setBonus] = useState<number | null>(null);
  const [adNote, setAdNote] = useState<string | null>(null);

  const levelId = params.get("level") ?? "1-1";
  const last = getLastResult();
  const result = last && last.levelId === levelId ? last : null;
  const stars = result ? result.stars : (progress.levels[levelId]?.stars ?? 0);
  const look = lookOf(progress);

  const next = nextLevelId(levelId);
  const nextOpen = next !== null && isLevelUnlocked(progress, next, unlockAll);
  const busy = navigating || rewarded.busy;
  const bonusAvailable = result !== null && bonus === null && canClaimAdBonus();

  // Suara: bintang satu per satu (nada naik), lalu koin, lalu level up atau achievement.
  useEffect(() => {
    for (let i = 0; i < stars; i++) {
      playSfx("star", { rate: 1 + i * 0.15, delay: 0.25 + i * 0.18 });
    }
    if (result && result.coins > 0) playSfx("coin", { delay: 0.9 });
    if (result?.levelUp) playSfx("levelUp", { delay: 1.1 });
    else if (result && result.unlocked.length > 0) playSfx("unlock", { delay: 1.1 });
  }, []);

  /** Interstitial hanya di jeda alami ini (pemain menekan Next Level), dan hanya jika kebijakan mengizinkan. */
  const goNext = async () => {
    if (!next) return;
    setNavigating(true);
    await maybeShowInterstitial("next-level");
    navigate(`/play/${next}`);
  };

  /** Bonus koin hanya diberikan jika rewarded ad ditonton sampai selesai. */
  const watchForBonus = async () => {
    if (!result) return;
    setAdNote(null);
    const outcome = await rewarded.request(
      "bonus-coins",
      `Watch a short ad to earn +${result.coins} bonus coins.`,
    );
    if (outcome === "granted") {
      const granted = claimAdBonus();
      setBonus(granted);
      if (granted > 0) playSfx("coin");
    } else if (outcome === "unavailable") {
      setAdNote("No ad is available right now. Please try again later.");
    } else if (outcome === "dismissed") {
      setAdNote("Watch the whole ad to get the bonus.");
    }
  };

  return (
    <div className={styles.root}>
      <Link to="/worlds" className={styles.home} aria-label="Back to Worlds">
        <Icon name="home" size={22} />
      </Link>

      <div className={styles.confetti} aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={styles.piece}
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              background: c.color,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>

      <div className={styles.stars} role="img" aria-label={`${stars} of 3 stars`}>
        {[0, 1, 2].map((i) => (
          <Icon
            key={i}
            name="star"
            size={i === 1 ? 84 : 64}
            className={styles.star}
            style={{
              color: i < stars ? "var(--color-yellow-500)" : "rgba(255,255,255,0.22)",
              animationDelay: `${i * 0.15}s`,
              marginTop: i === 1 ? 0 : 16,
            }}
          />
        ))}
      </div>

      <h1 className={styles.title}>Level Complete!</h1>
      <p className={styles.sub}>Great job! You solved the puzzle.</p>

      <RobotMascot pose="cheer" size={130} accent={look.accent} accessory={look.accessory} />

      {result ? (
        <ul className={styles.objectives}>
          {result.objectives.map((objective) => (
            <li
              key={objective.id}
              className={`${styles.objective} ${objective.done ? styles.objDone : ""}`}
            >
              <span className={styles.objMark} aria-hidden="true">
                {objective.done ? <Icon name="check" size={14} /> : null}
              </span>
              <span>{objective.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {result ? (
        <div className={styles.rewards}>
          <span className={styles.reward}>
            <Icon name="coin" size={28} style={{ color: "var(--color-yellow-500)" }} />+
            {result.coins}
            {bonus ? ` (+${bonus} bonus)` : ""}
          </span>
          <span className={styles.reward}>
            <Icon name="star" size={28} style={{ color: "var(--color-yellow-500)" }} />+
            {result.xp} XP
          </span>
        </div>
      ) : null}

      {bonusAvailable ? (
        <Button
          variant="secondary"
          disabled={busy}
          icon={<Icon name="coin" size={20} />}
          onClick={() => void watchForBonus()}
        >
          Double coins (watch ad)
        </Button>
      ) : null}

      {adNote ? (
        <p className={styles.sub} role="status">
          {adNote}
        </p>
      ) : null}

      {result?.levelUp ? (
        <p className={styles.sub} role="status" style={{ color: "var(--color-yellow-500)" }}>
          Level up! You reached player level {result.levelUp}.
        </p>
      ) : null}

      {result
        ? result.unlocked.map((id) => (
            <p key={id} className={styles.sub} role="status">
              Achievement unlocked: {achievementTitle(id)}
            </p>
          ))
        : null}

      <div className={styles.actions}>
        {nextOpen && next ? (
          <Button disabled={busy} onClick={() => void goNext()}>
            Next Level
          </Button>
        ) : (
          <Button disabled={busy} onClick={() => navigate("/worlds")}>
            Worlds
          </Button>
        )}
        <Button
          variant="dark"
          disabled={busy}
          icon={<Icon name="reset" size={20} />}
          onClick={() => navigate(`/play/${levelId}`)}
        >
          Replay
        </Button>
      </div>

      {rewarded.dialog}
    </div>
  );
}