import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toggle } from "@/components/ui/Toggle";
import { useT } from "@/i18n";
import { resetAllProgress, updateSettings, useSettings } from "@/state/settings";
import styles from "./pages.module.css";

export function SettingsPage() {
  const settings = useSettings();
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const closeConfirm = () => setConfirming(false);

  return (
    <section className={styles.page}>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className={styles.card}>
        <div className={styles.setting}>
          <div>
            <h2 className={styles.cardTitle}>{t("settings.sound")}</h2>
            <p className={styles.muted}>{t("settings.soundDesc")}</p>
          </div>
          <Toggle
            label={t("settings.sound")}
            checked={settings.sound}
            onChange={(sound) => updateSettings({ sound })}
          />
        </div>

        <div className={styles.setting}>
          <div>
            <h2 className={styles.cardTitle}>{t("settings.music")}</h2>
            <p className={styles.muted}>{t("settings.musicDesc")}</p>
          </div>
          <Toggle
            label={t("settings.music")}
            checked={settings.music}
            onChange={(music) => updateSettings({ music })}
          />
        </div>

        <div className={styles.setting}>
          <div>
            <h2 className={styles.cardTitle}>{t("settings.animations")}</h2>
            <p className={styles.muted}>{t("settings.animationsDesc")}</p>
          </div>
          <Toggle
            label={t("settings.animations")}
            checked={settings.animations}
            onChange={(animations) => updateSettings({ animations })}
          />
        </div>

        <div className={styles.setting}>
          <div>
            <h2 className={styles.cardTitle}>{t("settings.language")}</h2>
            <p className={styles.muted}>{t("settings.languageDesc")}</p>
          </div>
          <select
            className={styles.select}
            aria-label={t("settings.language")}
            value={settings.language}
            onChange={(e) =>
              updateSettings({ language: e.target.value === "id" ? "id" : "en" })
            }
          >
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>

        {import.meta.env.DEV ? (
          <div className={styles.setting}>
            <div>
              <h2 className={styles.cardTitle}>{t("settings.unlock")}</h2>
              <p className={styles.muted}>{t("settings.unlockDesc")}</p>
            </div>
            <Toggle
              label={t("settings.unlock")}
              checked={settings.unlockAll}
              onChange={(unlockAll) => updateSettings({ unlockAll })}
            />
          </div>
        ) : null}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{t("settings.reset")}</h2>
        <p className={styles.muted} style={{ margin: "4px 0 12px" }}>
          {t("settings.resetDesc")}
        </p>
        <Button variant="dark" onClick={() => setConfirming(true)}>
          {t("settings.reset")}
        </Button>
        {resetDone ? (
          <p className={styles.notice} style={{ marginTop: 12 }} role="status">
            {t("settings.resetDone")}
          </p>
        ) : null}
      </div>

      <Modal
        open={confirming}
        title={t("settings.confirmTitle")}
        onClose={closeConfirm}
        actions={
          <>
            <Button
              onClick={() => {
                resetAllProgress();
                setResetDone(true);
                closeConfirm();
              }}
            >
              {t("settings.confirmYes")}
            </Button>
            <Button variant="dark" onClick={closeConfirm}>
              {t("common.cancel")}
            </Button>
          </>
        }
      >
        {t("settings.confirmBody")}
      </Modal>
    </section>
  );
}