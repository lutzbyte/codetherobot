import { useState } from "react";
import { Article } from "@/components/ui/Article";
import { Button } from "@/components/ui/Button";
import { CONTACT } from "@/content/pages";
import { CONTACT_EXTRA } from "@/content/contactExtra";
import { levelsCompleted } from "@/progress/progressLogic";
import { getProgress } from "@/progress/progress";
import { useSettings } from "@/state/settings";
import { CONTACT_EMAIL, GAME_VERSION, SITE_NAME } from "@/site/siteInfo";
import styles from "./pages.module.css";

const SECTIONS = [...CONTACT, ...CONTACT_EXTRA];

/** Ringkasan teknis tanpa data pribadi, untuk ditempel di email laporan. */
function buildDiagnostics(sound: boolean, animations: boolean): string {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return [
    `${SITE_NAME} ${GAME_VERSION}`,
    `Browser: ${navigator.userAgent}`,
    `Language: ${navigator.language}`,
    `Viewport: ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
    `Reduced motion (system): ${reduced ? "yes" : "no"}`,
    `Sound: ${sound ? "on" : "off"}, animations: ${animations ? "on" : "off"}`,
    `Levels completed: ${levelsCompleted(getProgress())}`,
  ].join("\n");
}

export function ContactPage() {
  const settings = useSettings();
  const [note, setNote] = useState<string | null>(null);

  const copy = async () => {
    const text = buildDiagnostics(settings.sound, settings.animations);
    try {
      await navigator.clipboard.writeText(text);
      setNote("Copied. Paste it into your message.");
    } catch {
      setNote("Copying is blocked by this browser. Select and copy the text manually:\n" + text);
    }
  };

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${SITE_NAME} feedback`)}`;

  return (
    <Article title="Contact" subtitle="Bug reports, questions and feedback" sections={SECTIONS}>
      <div className={styles.row} style={{ flexWrap: "wrap" }}>
        <a href={mailto}>
          <Button>Write an email</Button>
        </a>
        <Button variant="dark" onClick={() => void copy()}>
          Copy technical summary
        </Button>
      </div>
      {note ? (
        <p className={styles.muted} role="status" style={{ whiteSpace: "pre-wrap" }}>
          {note}
        </p>
      ) : null}
    </Article>
  );
}