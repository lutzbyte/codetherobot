import { Button } from "@/components/ui/Button";
import styles from "./ErrorScreen.module.css";

interface ErrorScreenProps {
  message: string;
}

/** Layar penuh saat terjadi kesalahan tak terduga. Progres tersimpan tidak disentuh. */
export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <div className={styles.screen} role="alert">
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.text}>
        The game hit an unexpected problem. Your saved progress is safe.
      </p>
      <p className={styles.detail}>{message}</p>
      <div className={styles.actions}>
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <a href="/" className={styles.link}>
          Go home
        </a>
      </div>
    </div>
  );
}