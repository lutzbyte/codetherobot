import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useRewarded } from "@/ads/useRewarded";
import { playSfx } from "@/audio";
import { CommandEditor } from "@/components/editor/CommandEditor";
import { useRunnerState } from "@/components/editor/useRunnerState";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { StarRow } from "@/components/ui/StarRow";
import { countAll, createEditorState, editorReducer } from "@/engine/editor";
import type { Roots } from "@/engine/editor";
import { MAX_HINT_LEVEL, buildHint } from "@/engine/hints";
import { DEFAULT_LIMITS } from "@/engine/interpreter";
import type { RunStats } from "@/engine/objectives";
import { ProgramRunner } from "@/engine/runner";
import type { LevelDef } from "@/engine/types";
import { EventBus } from "@/game/EventBus";
import { gameController } from "@/game/GameController";
import { PhaserGame } from "@/game/PhaserGame";
import { lookOf } from "@/progress/cosmetics";
import { getProgress } from "@/progress/progress";
import styles from "./GameplayPage.module.css";

export interface PlaySessionProps {
  level: LevelDef;
  /** Teks di header (nama level atau mode). */
  title: string;
  /** Solusi referensi untuk petunjuk (hint). Kosong = hint tidak tersedia. */
  solution?: Roots;
  /** Bintang rekor di header. Kosong = tidak ditampilkan. */
  headerStars?: number;
  /** Batas waktu dalam detik (Time Challenge). */
  timeLimit?: number;
  /** Konten di bagian paling bawah panel editor (mis. banner iklan). Jauh dari tombol aksi. */
  panelFooter?: ReactNode;
  /** Dipanggil sekali saat level berhasil diselesaikan. */
  onComplete: (stats: RunStats, elapsedSeconds: number) => void;
  /** Dipanggil setiap percobaan yang gagal (menabrak, atau program selesai tanpa mencapai goal). */
  onAttemptFailed?: () => void;
  /** Dipanggil sekali saat batas waktu habis. */
  onTimeUp?: () => void;
  onQuit: () => void;
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/** Layar bermain bersama: editor, board Phaser, runner, timer, dan hint berbasis rewarded ad. */
export function PlaySession({
  level,
  title,
  solution,
  headerStars,
  timeLimit,
  panelFooter,
  onComplete,
  onAttemptFailed,
  onTimeUp,
  onQuit,
}: PlaySessionProps) {
  const limit = level.maxInstructions ?? DEFAULT_LIMITS.maxInstructions;

  const [editor, dispatch] = useReducer(editorReducer, level, (lvl) =>
    createEditorState([], lvl.functions ?? []),
  );
  const runner = useMemo(() => new ProgramRunner(gameController), []);
  const run = useRunnerState(runner);
  const rewarded = useRewarded();

  const [notice, setNotice] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [boardReady, setBoardReady] = useState(() => gameController.isReady());
  const resumeAfterMenu = useRef(false);
  const completed = useRef(false);
  const collectedStars = useRef(0);
  const lastStatus = useRef(run.status);

  const count = countAll(editor);
  const previousCount = useRef(count);

  const finished = run.status === "complete";
  const locked = run.status === "running" || run.status === "paused" || timedOut;
  const runOptions = { maxInstructions: limit, functions: editor.functions, level };

  useEffect(() => {
    gameController.load(level, lookOf(getProgress()));
  }, [level]);

  useEffect(
    () => EventBus.on("scene-ready", () => setBoardReady(true)),
    [],
  );

  // Jumlah bintang peta yang terkumpul dilaporkan scene sebelum status "complete".
  useEffect(
    () =>
      EventBus.on("level-complete", (payload) => {
        collectedStars.current = payload.starsCollected;
      }),
    [],
  );

  // Suara saat blok ditambah atau dihapus dari program.
  useEffect(() => {
    if (count > previousCount.current) playSfx("add");
    else if (count < previousCount.current) playSfx("remove");
    previousCount.current = count;
  }, [count]);

  // Timer berhenti saat menu jeda terbuka dan selama dialog atau iklan rewarded berlangsung.
  useEffect(() => {
    if (timeLimit === undefined || menuOpen || rewarded.busy || finished || timedOut) return;
    const id = window.setInterval(() => setElapsed((e) => e + 0.25), 250);
    return () => window.clearInterval(id);
  }, [timeLimit, menuOpen, rewarded.busy, finished, timedOut]);

  useEffect(() => {
    if (timeLimit === undefined || timedOut || finished || elapsed < timeLimit) return;
    setTimedOut(true);
    playSfx("fail");
    void runner.reset();
    onTimeUp?.();
  }, [elapsed]);

  useEffect(() => {
    if (run.status !== "complete" || completed.current) return;
    completed.current = true;
    onComplete(
      {
        blocks: countAll(editor),
        steps: run.stepsExecuted,
        starsCollected: collectedStars.current,
      },
      elapsed,
    );
  }, [run.status]);

  // Percobaan gagal = menabrak atau program selesai tanpa goal. Program tidak valid (0 langkah) tidak dihitung.
  useEffect(() => {
    const previous = lastStatus.current;
    lastStatus.current = run.status;
    if (previous === run.status) return;
    if ((run.status === "failed" || run.status === "finished") && run.stepsExecuted > 0) {
      playSfx("fail");
      onAttemptFailed?.();
    }
  }, [run.status]);

  useEffect(() => {
    return () => {
      void runner.reset();
    };
  }, [runner]);

  const primary = () => {
    setNotice(null);
    if (run.status === "running") runner.pause();
    else if (run.status === "paused") runner.resume();
    else void runner.run(editor.program, runOptions);
  };

  const step = () => {
    setNotice(null);
    void runner.step(editor.program, runOptions);
  };

  const resetBoard = () => {
    setNotice(null);
    void runner.reset();
  };

  const openMenu = () => {
    resumeAfterMenu.current = run.status === "running";
    if (run.status === "running") runner.pause();
    playSfx("pause");
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    if (resumeAfterMenu.current) {
      resumeAfterMenu.current = false;
      runner.resume();
    }
  };

  /** Satu iklan rewarded membuka satu tingkat hint. Hint hanya diberikan jika iklan ditonton penuh. */
  const watchForHint = async () => {
    const next = hintLevel + 1;
    const outcome = await rewarded.request(
      "hint",
      `Watch a short ad to unlock hint ${next} of ${MAX_HINT_LEVEL}.`,
    );
    if (outcome === "granted") {
      setHintLevel(next);
      setHintOpen(true);
    } else if (outcome === "unavailable") {
      setNotice("No ad is available right now. Please try again later.");
    } else if (outcome === "dismissed") {
      setNotice("Watch the whole ad to unlock the hint.");
    }
  };

  const onHint = () => {
    setNotice(null);
    if (!solution) {
      setNotice("No hint is available for this level.");
      return;
    }
    if (hintLevel > 0) setHintOpen(true);
    else void watchForHint();
  };

  const primaryLabel =
    run.status === "running" ? "Pause" : run.status === "paused" ? "Resume" : "Execute";
  const primaryIcon = run.status === "running" ? "pause" : "play";
  const remaining = timeLimit !== undefined ? timeLimit - elapsed : null;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Menu"
          onClick={openMenu}
        >
          <Icon name="pause" size={22} />
        </button>
        <span className={styles.levelName}>{title}</span>
        {headerStars !== undefined ? <StarRow earned={headerStars} size={24} /> : null}
        {remaining !== null ? (
          <span
            className={styles.levelName}
            style={{ color: remaining <= 20 ? "var(--color-orange-500)" : undefined }}
            aria-live="off"
          >
            <Icon name="clock" size={16} /> {formatClock(remaining)}
          </span>
        ) : null}
        <span className={styles.spacer} />
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Reset board"
          onClick={resetBoard}
        >
          <Icon name="reset" size={22} />
        </button>
        <Link
          to="/settings"
          className={`${styles.iconBtn} ${styles.iconBtnDark}`}
          aria-label="Settings"
        >
          <Icon name="settings" size={22} />
        </Link>
      </header>

      <div className={styles.main}>
        <div className={styles.board}>
          <div className={styles.boardInner}>
            <PhaserGame />
          </div>
          {!boardReady ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "#3d93d4",
              }}
            >
              <Spinner label="Loading board" />
            </div>
          ) : null}
        </div>

        <aside className={styles.panel} aria-label="Command editor" data-no-sfx>
          <CommandEditor
            editor={editor}
            dispatch={dispatch}
            level={level}
            limit={limit}
            locked={locked}
            activeId={run.activeId}
            failed={run.status === "failed"}
          />
          <p
            className={`${styles.status} ${run.status === "failed" ? styles.statusError : ""}`}
            aria-live="polite"
          >
            {notice ?? run.message}
          </p>
          {locked && !timedOut ? (
            <p className={styles.hint}>Press Reset to edit your program.</p>
          ) : null}
          {panelFooter ? <div style={{ marginTop: 120 }}>{panelFooter}</div> : null}
        </aside>
      </div>

      <footer className={styles.bar}>
        <Button
          icon={<Icon name={primaryIcon} size={20} />}
          disabled={timedOut}
          onClick={primary}
        >
          {primaryLabel}
        </Button>
        <Button
          variant="dark"
          icon={<Icon name="step" size={20} />}
          disabled={run.status === "running" || timedOut}
          onClick={step}
        >
          Step
        </Button>
        <Button variant="dark" icon={<Icon name="reset" size={20} />} onClick={resetBoard}>
          Reset
        </Button>
        <Button
          variant="dark"
          icon={<Icon name="hint" size={20} />}
          disabled={run.status === "running" || rewarded.busy || timedOut}
          onClick={onHint}
        >
          Hint
        </Button>
      </footer>

      <Modal
        open={menuOpen}
        title="Paused"
        onClose={closeMenu}
        actions={
          <>
            <Button onClick={closeMenu}>Resume</Button>
            <Button
              variant="dark"
              onClick={() => {
                resumeAfterMenu.current = false;
                resetBoard();
                setMenuOpen(false);
              }}
            >
              Restart
            </Button>
            <Button variant="dark" onClick={onQuit}>
              Quit
            </Button>
          </>
        }
      >
        Take your time. Your program is kept until you clear it.
      </Modal>

      <Modal
        open={hintOpen && solution !== undefined}
        title={`Hint ${hintLevel} of ${MAX_HINT_LEVEL}`}
        onClose={() => setHintOpen(false)}
        actions={
          <>
            {hintLevel < MAX_HINT_LEVEL ? (
              <Button
                onClick={() => {
                  setHintOpen(false);
                  void watchForHint();
                }}
              >
                Next hint (watch ad)
              </Button>
            ) : null}
            <Button variant="dark" onClick={() => setHintOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {solution
          ? Array.from({ length: hintLevel }, (_, i) => (
              <pre
                key={i}
                style={{
                  margin: "0 0 12px",
                  whiteSpace: "pre-wrap",
                  font: "inherit",
                  color: "var(--text-on-dark)",
                }}
              >
                {buildHint(solution, i + 1)}
              </pre>
            ))
          : null}
      </Modal>

      {rewarded.dialog}
    </div>
  );
}