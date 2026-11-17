import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { useT } from "@/i18n";
import type { TextKey } from "@/i18n";
import {
  WEEKLY_REWARD,
  WEEKLY_TARGET,
  dailyStreak,
  dateKey,
  weekKeyOf,
  weeklyDone,
} from "@/progress/challenges";
import { claimWeeklyReward, useProgress } from "@/progress/progress";
import styles from "./pages.module.css";

interface ModeCard {
  kind: "endless" | "time" | "minimum";
  title: TextKey;
  desc: TextKey;
  icon: IconName;
  color: string;
}

const MODES: ModeCard[] = [
  { kind: "endless", title: "modes.endless", desc: "modes.endlessDesc", icon: "repeat", color: "#7a5af8" },
  { kind: "time", title: "modes.time", desc: "modes.timeDesc", icon: "clock", color: "#f5882a" },
  { kind: "minimum", title: "modes.minimum", desc: "modes.minimumDesc", icon: "diamond", color: "#3fb950" },
];

function hoursUntilMidnight(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 3_600_000));
}

export function DailyPage() {
  const t = useT();
  const navigate = useNavigate();
  const data = useProgress();
  const [claimed, setClaimed] = useState(false);

  const today = dateKey(new Date());
  const week = weekKeyOf(today);
  const todayStars = data.dailyDone[today];
  const streak = dailyStreak(Object.keys(data.dailyDone), today);
  const weekly = weeklyDone(data, week);
  const weeklyClaimed = data.weeklyClaimed[week] === true || claimed;
  const canClaim = !weeklyClaimed && weekly >= WEEKLY_TARGET;

  const best: Record<ModeCard["kind"], string> = {
    endless: data.modes.endlessBest > 0 ? `${data.modes.endlessBest}` : "",
    time: data.modes.timeBest !== null ? `${data.modes.timeBest}s` : "",
    minimum: data.modes.minimumSolved > 0 ? `${data.modes.minimumSolved}` : "",
  };

  return (
    <section className={styles.page}>
      <PageHeader title={t("daily.title")} subtitle={t("daily.subtitle")} />

      <div className={styles.dailyHero}>
        <div>
          <h2 className={styles.cardTitle}>{t("daily.today")}</h2>
          <p className={styles.muted}>
            {todayStars !== undefined
              ? t("daily.done", { stars: todayStars })
              : t("daily.reward", { coins: "40+", xp: 40 })}
          </p>
          <p className={styles.muted}>
            {t("daily.reset", { hours: hoursUntilMidnight() })} {t("daily.streak", { days: streak })}
          </p>
        </div>
        <Button
          icon={<Icon name="play" size={20} />}
          onClick={() => navigate("/challenge/daily")}
        >
          {todayStars !== undefined ? t("daily.again") : t("daily.start")}
        </Button>
      </div>

      <article className={styles.card}>
        <h2 className={styles.cardTitle}>{t("weekly.title")}</h2>
        <p className={styles.muted}>{t("weekly.desc", { target: WEEKLY_TARGET })}</p>
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={WEEKLY_TARGET}
          aria-valuenow={Math.min(weekly, WEEKLY_TARGET)}
          aria-label={t("weekly.title")}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${(Math.min(weekly, WEEKLY_TARGET) / WEEKLY_TARGET) * 100}%` }}
          />
        </div>
        <p className={styles.muted} style={{ marginTop: 6 }}>
          {t("weekly.progress", { done: Math.min(weekly, WEEKLY_TARGET), target: WEEKLY_TARGET })}
          {" · "}
          {t("weekly.reward", WEEKLY_REWARD)}
        </p>
        <p style={{ marginTop: 12 }}>
          {weeklyClaimed ? (
            <span className={`${styles.tag} ${styles.tagGreen}`}>{t("weekly.claimed")}</span>
          ) : (
            <Button
              disabled={!canClaim}
              onClick={() => setClaimed(claimWeeklyReward(week))}
            >
              {t("weekly.claim")}
            </Button>
          )}
        </p>
      </article>

      <div className={styles.grid}>
        {MODES.map((mode) => (
          <article key={mode.kind} className={styles.card}>
            <div className={styles.row}>
              <span className={styles.badge} style={{ background: mode.color }}>
                <Icon name={mode.icon} size={24} />
              </span>
              <div className={styles.rowGrow}>
                <h2 className={styles.cardTitle}>{t(mode.title)}</h2>
                <p className={styles.muted}>{t(mode.desc)}</p>
              </div>
            </div>
            <p className={styles.muted} style={{ marginTop: 10 }}>
              {best[mode.kind]
                ? t("modes.best", { value: best[mode.kind] })
                : t("modes.none")}
            </p>
            <p style={{ marginTop: 10 }}>
              <Button
                variant="secondary"
                onClick={() => navigate(`/challenge/${mode.kind}`)}
              >
                {t("modes.play")}
              </Button>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}