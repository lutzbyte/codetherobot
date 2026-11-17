import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRewarded } from "@/ads/useRewarded";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StarRow } from "@/components/ui/StarRow";
import {
  dailyEntry,
  endlessEntry,
  minimumEntry,
  timeEntry,
} from "@/data/levels/challengeLevels";
import { achievementTitle } from "@/progress/achievements";
import { TIME_LIMIT_SECONDS, dateKey } from "@/progress/challenges";
import {
  completeDaily,
  completeEndlessRound,
  completeMinimumChallenge,
  completeTimeChallenge,
} from "@/progress/progress";
import type { ChallengeResult } from "@/progress/progress";
import extra from "./phase7.module.css";
import { PlaySession } from "./PlaySession";

const MAX_LIVES = 3;

function newSeed(): number {
  return Date.now() % 1_000_000;
}

function ResultLines({ result }: { result: ChallengeResult }) {
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      {result.stars !== null ? <StarRow earned={result.stars} size={28} /> : null}
      <span>{result.detail}</span>
      <span>
        +{result.coins} coins · +{result.xp} XP
      </span>
      {result.levelUp ? <span>Level up! You are now level {result.levelUp}.</span> : null}
      {result.unlocked.map((id) => (
        <span key={id}>Achievement unlocked: {achievementTitle(id)}</span>
      ))}
    </div>
  );
}

function DailyChallenge() {
  const navigate = useNavigate();
  const key = useMemo(() => dateKey(new Date()), []);
  const entry = useMemo(() => dailyEntry(key), [key]);
  const [result, setResult] = useState<ChallengeResult | null>(null);

  const back = () => navigate("/daily");

  return (
    <>
      <PlaySession
        level={entry.level}
        solution={entry.solution}
        title="Daily Challenge"
        onComplete={(stats) => setResult(completeDaily(key, entry.level, stats))}
        onQuit={back}
      />
      <Modal
        open={result !== null}
        title="Daily Challenge"
        onClose={back}
        actions={<Button onClick={back}>Back to challenges</Button>}
      >
        {result ? <ResultLines result={result} /> : null}
      </Modal>
    </>
  );
}

function EndlessChallenge() {
  const navigate = useNavigate();
  const rewarded = useRewarded();
  const [seed, setSeed] = useState(newSeed);
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(MAX_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [extraUsed, setExtraUsed] = useState(false);
  const [adNote, setAdNote] = useState<string | null>(null);
  const [solved, setSolved] = useState<ChallengeResult | null>(null);
  const entry = useMemo(() => endlessEntry(round, seed), [round, seed]);

  const back = () => navigate("/daily");

  const restart = () => {
    setSeed(newSeed());
    setRound(1);
    setLives(MAX_LIVES);
    setGameOver(false);
    setExtraUsed(false);
    setAdNote(null);
    setSolved(null);
  };

  /** Satu nyawa tambahan per permainan, hanya jika rewarded ad ditonton penuh. */
  const watchForExtraLife = async () => {
    setAdNote(null);
    const outcome = await rewarded.request(
      "extra-life",
      "Watch a short ad to get one extra life and keep your run going.",
    );
    if (outcome === "granted") {
      setExtraUsed(true);
      setLives(1);
      setGameOver(false);
    } else if (outcome === "unavailable") {
      setAdNote("No ad is available right now. Please try again later.");
    } else if (outcome === "dismissed") {
      setAdNote("Watch the whole ad to get the extra life.");
    }
  };

  return (
    <>
      <PlaySession
        key={`${seed}-${round}`}
        level={entry.level}
        solution={entry.solution}
        title={`Round ${round} · Lives ${lives}`}
        onComplete={() => setSolved(completeEndlessRound(round))}
        onAttemptFailed={() => {
          const next = lives - 1;
          setLives(next);
          if (next <= 0) setGameOver(true);
        }}
        onQuit={back}
      />
      <Modal
        open={solved !== null && !gameOver}
        title={`Round ${round} solved`}
        onClose={() => undefined}
        actions={
          <>
            <Button
              onClick={() => {
                setSolved(null);
                setRound(round + 1);
              }}
            >
              Next puzzle
            </Button>
            <Button variant="dark" onClick={back}>
              Finish run
            </Button>
          </>
        }
      >
        {solved ? <ResultLines result={solved} /> : null}
      </Modal>
      <Modal
        open={gameOver && !rewarded.busy}
        title="Game over"
        onClose={back}
        actions={
          <>
            {!extraUsed ? (
              <Button variant="secondary" onClick={() => void watchForExtraLife()}>
                Extra life (watch ad)
              </Button>
            ) : null}
            <Button onClick={restart}>Play again</Button>
            <Button variant="dark" onClick={back}>
              Back to challenges
            </Button>
          </>
        }
      >
        You solved {round - 1} {round - 1 === 1 ? "puzzle" : "puzzles"} before running out of lives.
        {adNote ? ` ${adNote}` : ""}
      </Modal>
      {rewarded.dialog}
    </>
  );
}

function TimeChallenge() {
  const navigate = useNavigate();
  const [seed, setSeed] = useState(newSeed);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const entry = useMemo(() => timeEntry(seed), [seed]);

  const back = () => navigate("/daily");
  const another = () => {
    setSeed(newSeed());
    setResult(null);
    setTimeUp(false);
  };

  return (
    <>
      <PlaySession
        key={seed}
        level={entry.level}
        solution={entry.solution}
        title="Time Challenge"
        timeLimit={TIME_LIMIT_SECONDS}
        onComplete={(_stats, elapsed) => setResult(completeTimeChallenge(elapsed))}
        onTimeUp={() => setTimeUp(true)}
        onQuit={back}
      />
      <Modal
        open={result !== null}
        title="Time Challenge"
        onClose={back}
        actions={
          <>
            <Button onClick={another}>Another puzzle</Button>
            <Button variant="dark" onClick={back}>
              Back to challenges
            </Button>
          </>
        }
      >
        {result ? <ResultLines result={result} /> : null}
      </Modal>
      <Modal
        open={timeUp && result === null}
        title="Time's up!"
        onClose={back}
        actions={
          <>
            <Button onClick={another}>Try another puzzle</Button>
            <Button variant="dark" onClick={back}>
              Back to challenges
            </Button>
          </>
        }
      >
        The clock ran out before you reached the goal.
      </Modal>
    </>
  );
}

function MinimumChallenge() {
  const navigate = useNavigate();
  const [seed, setSeed] = useState(newSeed);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const entry = useMemo(() => minimumEntry(seed), [seed]);

  const back = () => navigate("/daily");
  const another = () => {
    setSeed(newSeed());
    setResult(null);
  };

  return (
    <>
      <PlaySession
        key={seed}
        level={entry.level}
        solution={entry.solution}
        title={`Minimum: ${entry.level.parCommands} blocks`}
        onComplete={() => setResult(completeMinimumChallenge())}
        onQuit={back}
      />
      <Modal
        open={result !== null}
        title="Minimum Commands"
        onClose={back}
        actions={
          <>
            <Button onClick={another}>Another puzzle</Button>
            <Button variant="dark" onClick={back}>
              Back to challenges
            </Button>
          </>
        }
      >
        {result ? <ResultLines result={result} /> : null}
      </Modal>
    </>
  );
}

export function ChallengePage() {
  const { kind } = useParams();
  switch (kind) {
    case "daily":
      return <DailyChallenge />;
    case "endless":
      return <EndlessChallenge />;
    case "time":
      return <TimeChallenge />;
    case "minimum":
      return <MinimumChallenge />;
    default:
      return (
        <div className={extra.centerMessage}>
          <p>This challenge does not exist.</p>
          <Link to="/daily" style={{ textDecoration: "underline" }}>
            Back to challenges
          </Link>
        </div>
      );
  }
}