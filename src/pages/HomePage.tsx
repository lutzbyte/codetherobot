import { Link, useNavigate } from "react-router-dom";
import { HeroScene } from "@/components/art/HeroScene";
import { RobotMascot } from "@/components/art/RobotMascot";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import styles from "./HomePage.module.css";

interface Feature {
  label: string;
  icon: IconName;
  color: string;
  to: string;
}

const FEATURES: Feature[] = [
  { label: "Learn Programming", icon: "code", color: "#7a5af8", to: "/worlds" },
  { label: "75+ Levels", icon: "trophy", color: "#3fb950", to: "/worlds" },
  { label: "Earn Stars", icon: "star", color: "#f5882a", to: "/achievements" },
  { label: "Customize Your Robot", icon: "paint", color: "#2f6bdb", to: "/collection" },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.sceneWrap}>
          <HeroScene className={styles.scene} />
          <RobotMascot className={styles.robot} size={260} />
        </div>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Think. Code.
            <span className={styles.accent}>Execute.</span>
          </h1>
          <p className={styles.lead}>
            Solve programming puzzles, guide the robot, and level up your
            coding skills!
          </p>
          <Button
            className={styles.cta}
            icon={<Icon name="play" size={22} />}
            onClick={() => navigate("/worlds")}
          >
            Play Now
          </Button>
        </div>
      </section>

      <section className={styles.features} aria-label="Features">
        {FEATURES.map((f) => (
          <Link key={f.label} to={f.to} className={styles.feature}>
            <span className={styles.featureBadge} style={{ background: f.color }}>
              <Icon name={f.icon} size={24} />
            </span>
            <span className={styles.featureLabel}>{f.label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}