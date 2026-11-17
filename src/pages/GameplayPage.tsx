import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdBanner } from "@/ads/AdBanner";
import { recordLevelCompleted } from "@/ads/adService";
import { getLevelDef } from "@/data/levelLookup";
import { getLevelEntry } from "@/data/levels/catalog";
import { levelLabel } from "@/data/uiData";
import { completeLevel, useProgress } from "@/progress/progress";
import { PlaySession } from "./PlaySession";

/** key = levelId: pindah level selalu memulai editor dan runner dari awal. */
export function GameplayPage() {
  const { levelId = "1-1" } = useParams();
  return <CampaignSession key={levelId} levelId={levelId} />;
}

function CampaignSession({ levelId }: { levelId: string }) {
  const navigate = useNavigate();
  const level = useMemo(() => getLevelDef(levelId), [levelId]);
  const solution = useMemo(() => getLevelEntry(levelId)?.solution, [levelId]);
  const progress = useProgress();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <PlaySession
      level={level}
      solution={solution}
      title={levelLabel(levelId)}
      headerStars={progress.levels[levelId]?.stars ?? 0}
      panelFooter={<AdBanner placement="play" mobileOnly />}
      onComplete={(stats) => {
        completeLevel(level, stats);
        recordLevelCompleted();
        timer.current = window.setTimeout(
          () => navigate(`/complete?level=${levelId}`),
          300,
        );
      }}
      onQuit={() => navigate("/worlds")}
    />
  );
}